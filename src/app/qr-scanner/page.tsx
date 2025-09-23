"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";

/*
Fixes:
- Wait for <video> ref to mount before setting srcObject (prevents 'Cannot set properties of null').
- Strong cleanup remains the same, scanning loop unchanged.
*/

type CamPerm = "granted" | "denied" | "prompt";
const TARGET_QR = "REFERRER_QR_CODE_12345";

/* ---------- helpers ---------- */
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

/* ---------- component ---------- */
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
                setScannedData(value);
                alert(value === TARGET_QR ? "QR matched expected referrer code." : `Scanned QR: ${value}`);
                stopScanner();
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
            setScannedData(code.data);
            alert(code.data === TARGET_QR ? "QR matched expected referrer code." : `Scanned QR: ${code.data}`);
            stopScanner();
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
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={handleBackToHome}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 mr-4"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Home
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">PaySkill</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">QR Code Scanner</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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

            {cameraPermission === "prompt" && (
              <div className="space-y-6">
                <div className="w-64 h-64 mx-auto bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Camera Preview</p>
                  </div>
                </div>
                <button
                  onClick={requestCameraPermission}
                  className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 font-medium text-lg"
                >
                  Start Camera
                </button>
              </div>
            )}

            {cameraPermission === "denied" && (
              <div className="space-y-6">
                <div className="w-64 h-64 mx-auto bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center border-2 border-dashed border-red-300 dark:border-red-600">
                  <div className="text-center">
                    <div className="text-4xl mb-2">❌</div>
                    <p className="text-red-500 dark:text-red-400 text-sm">Camera Access Denied</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Camera permission is required. Use HTTPS (e.g., https://ngrok.com/ or
                    https://localtunnel.github.io/www/) and allow camera access.
                  </p>
                  <button
                    onClick={requestCameraPermission}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 font-medium"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {cameraPermission === "granted" && !scannedData && (
              <div className="space-y-6">
                <div className="w-80 h-80 mx-auto bg-black rounded-xl relative overflow-hidden border-2 border-blue-300 dark:border-blue-600">
                  <video ref={videoRef} className="w-full h-full object-cover rounded-xl" playsInline muted autoPlay />
                  <div className="absolute inset-4 pointer-events-none">
                    <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-blue-400" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-blue-400" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-blue-400" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-blue-400" />
                  </div>
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse" />
                      Scanning...
                    </div>
                  </div>
                </div>

                <canvas ref={canvasRef} style={{ display: "none" }} />

                <div className="flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
                  <p className="text-gray-600 dark:text-gray-400">Looking for QR code...</p>
                </div>

                <button
                  onClick={stopScanner}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  Stop Scanning
                </button>
              </div>
            )}

            {scannedData && (
              <div className="space-y-6">
                <div className="w-64 h-64 mx-auto bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center border-2 border-dashed border-green-300 dark:border-green-600">
                  <div className="text-center">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-green-500 dark:text-green-400 text-sm">QR Code Scanned!</p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Scanned Data:</p>
                  <p className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border break-all">{scannedData}</p>
                </div>
                <button
                  onClick={handleScanComplete}
                  className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 font-medium text-lg"
                >
                  Complete Task
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">📋 Scanning Tips</h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200">
            <li className="flex items-start"><span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />Hold steady with good lighting</li>
            <li className="flex items-start"><span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />Keep the code in the frame</li>
            <li className="flex items-start"><span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />Avoid blur/damage</li>
            <li className="flex items-start"><span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />Use proper distance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
