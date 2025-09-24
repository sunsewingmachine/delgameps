"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";

import Header from "./Header";
import ScannerArea from "./ScannerArea";
import Tips from "./Tips";

type CamPerm = "granted" | "denied" | "prompt";
const TARGET_QR = "REFERRER_QR_CODE_12345";

/* ---------- helpers ---------- */

function navigateIfUrl(value: string) {
  if (!value) return false;
  try {
    let url = value.trim();

    // Try parsing as-is first
    try {
      new URL(url);
    } catch {
      // If missing scheme but looks like domain (e.g., example.com/path), prepend https://
      if (/^[\w-]+(\.[\w-]+)+/.test(url)) {
        url = "https://" + url;
      } else {
        return false;
      }
    }

    // Final sanity parse and navigate
    const parsed = new URL(url);
    // Navigate away to the URL
    window.location.href = parsed.toString();
    return true;
  } catch {
    return false;
  }
}
async function getCameraStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("getUserMedia not available. Use HTTPS/localhost.");
  }
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } },
    audio: false,
  });
}

// wait until React mounts the <video> (after state flip to "granted")
function waitForVideoRef(videoRef: React.RefObject<HTMLVideoElement | null>) {
  return new Promise<HTMLVideoElement>((resolve, reject) => {
    let tries = 0;
    const maxTries = 120; // ~2s @ 60fps
    const tick = () => {
      const v = videoRef.current;
      if (v) return resolve(v);
      if (++tries > maxTries) return reject(new Error("Video element not mounted in time."));
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function stopMediaStream(stream?: MediaStream | null) {
  stream?.getTracks()?.forEach((t) => t.stop());
}

/* ---------- page component ---------- */
export default function QRScannerPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<CamPerm>("prompt");
  const [scannedData, setScannedData] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const detectorRef = useRef<any>(null);

  // auth
  useEffect(() => {
    const auth = localStorage.getItem("PaySkill-auth");
    const p = localStorage.getItem("PaySkill-phone");
    if (auth === "true" && p) setChecking(false);
    else router.replace("/login");
  }, [router]);

  const cleanUp = useCallback(() => {
    isScanningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        // detach stream
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        videoRef.current.srcObject = null;
      } catch {}
    }
    stopMediaStream(streamRef.current);
    streamRef.current = null;
  }, []);

  useEffect(() => {
    const onHide = () => cleanUp();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      cleanUp();
    };
  }, [cleanUp]);

  const handleBackToHome = () => router.push("/home");
  const stopScanner = useCallback(() => cleanUp(), [cleanUp]);

  const requestCameraPermission = useCallback(async () => {
    try {
      // 1) get stream first
      const stream = await getCameraStream();
      streamRef.current = stream;

      // 2) flip UI so <video> appears, then wait for it to mount
      setCameraPermission("granted");
      const video = await waitForVideoRef(videoRef);

      // 3) attach and play
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play().catch(() => {});

      // 4) wait for size info
      await new Promise<void>((res) => {
        if (video.readyState >= video.HAVE_METADATA) res();
        else (video.onloadedmetadata = () => res());
      });

      // 5) optional native detector
      const BD = (window as any).BarcodeDetector;
      if (BD) {
        try {
          detectorRef.current = new BD({ formats: ["qr_code"] });
        } catch {
          detectorRef.current = null;
        }
      }

      // 6) scan loop
      isScanningRef.current = true;
      const loop = async () => {
        if (!isScanningRef.current) return;
        const v = videoRef.current;
        const c = canvasRef.current;
        if (!v || !c) return;

        if (v.readyState < v.HAVE_ENOUGH_DATA) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        // try native
        if (detectorRef.current) {
          try {
            const detections = await detectorRef.current.detect(v);
            if (detections?.length) {
              const value = detections[0].rawValue || detections[0].data || "";
              if (value) {
                // stop camera and navigate: if value is a URL, navigate to it; otherwise go to home
                stopScanner();
                if (navigateIfUrl(value)) return;
                router.push("/home");
                return;
              }
            }
          } catch {}
        }

        // fallback jsQR
        const ctx = c.getContext("2d");
        if (ctx) {
          const vw = v.videoWidth || 640;
          const vh = v.videoHeight || 480;
          c.width = vw;
          c.height = vh;
          ctx.drawImage(v, 0, 0, vw, vh);
          const img = ctx.getImageData(0, 0, vw, vh);
          const code = jsQR(img.data, img.width, img.height);
          if (code?.data) {
            const value = code.data;
            // stop camera and navigate: if value is a URL, navigate to it; otherwise go to home
            stopScanner();
            if (navigateIfUrl(value)) return;
            router.push("/home");
            return;
          }
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch (err: any) {
      cleanUp();
      setCameraPermission("denied");
      console.error(err);
      alert(
        err?.message ||
          "Unable to access camera. Ensure HTTPS (or localhost) and allow camera permission."
      );
    }
  }, [cleanUp, stopScanner]);

  const handleScanComplete = () => router.push("/home");

  if (checking) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-t-blue-500 border-gray-200 animate-spin" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading QR Scanner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-y-auto">
      <Header onBack={handleBackToHome} />

      {/* Main */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-6xl mb-6">📱</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Scan Referrer's QR Code</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Position the QR code within the camera frame to scan it. Make sure the code is clearly
              visible and well-lit.
            </p>

            <div>
              <ScannerArea
                cameraPermission={cameraPermission}
                scannedData={scannedData}
                videoRef={videoRef}
                canvasRef={canvasRef}
                requestCameraPermission={requestCameraPermission}
                stopScanner={stopScanner}
              />

              
            </div>
          </div>
        </div>

        <Tips />
      </div>
    </div>
  );
}
