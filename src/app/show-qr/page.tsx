'use client';

import React, { useState, useEffect } from "react";
import { getUserPhone } from '../../lib/userUtils';

// Purpose: QR code generator page that displays a DPS check QR only for a specific phone (9842470497).
// If unauthorized, the page renders nothing and returns the user to the previous page.
export default function ShowQrPage() {
  const [input, setInput] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const ALLOWED_PHONE = '9842470497';

  // Generate the DPS check URL with current epoch timestamp
  const generateDpsUrl = () => {
    const currentEpoch = Math.floor(Date.now() / 1000);
    return `https://dps-gamma.vercel.app/check/?arg=far99-task2&ep=${currentEpoch}`;
  };

  // --- Helpers ---
  const isValidUrl = (value: string) => {
    try {
      const u = new URL(value);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const normalizeUrl = (value: string) => {
    const v = value.trim();
    if (!v) return v;
    if (/^https?:\/\//i.test(v)) return v;
    if (/^[\w-]+(\.[\w-]+)+/.test(v)) return v;
    return v;
  };

  const buildQrSrc = (value: string) => {
    if (!value) return "";

    // Try multiple QR code services as fallbacks
    const services = [
      // QR-Server.com - free and reliable
      `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(value)}`,

      // Google Charts API (backup)
      `https://chart.googleapis.com/chart?cht=qr&chs=400x400&chl=${encodeURIComponent(value)}&chld=L|1`,

      // QRCode.show (backup)
      `https://qrcode.show/${encodeURIComponent(value)}`,
    ];

    return services[0]; // Start with the most reliable one
  };

  // Access guard: check phone stored in localStorage via getUserPhone()
  useEffect(() => {
    if (typeof window === 'undefined') {
      setAuthorized(false);
      return;
    }

    try {
      const phone = getUserPhone();
      if (phone === ALLOWED_PHONE) {
        setAuthorized(true);
      } else {
        setAuthorized(false);

        // Give a tiny delay so React can render the empty page (if needed) before navigating back
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.history && window.history.length > 0) {
            window.history.back();
          } else if (typeof window !== 'undefined') {
            // Fallback: navigate to root if history is not available
            window.location.href = '/';
          }
        }, 200);
      }
    } catch (err) {
      setAuthorized(false);
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.history && window.history.length > 0) {
          window.history.back();
        } else if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }, 200);
    }
  }, []);

  // Set the DPS URL on component mount — declares the hook unconditionally,
  // but only runs its logic when authorized === true (keeps hooks order stable).
  useEffect(() => {
    if (!authorized) return;

    const dpsUrl = generateDpsUrl();
    setInput(dpsUrl);
    // Auto-generate QR code for the DPS URL with animation delay
    const t1 = setTimeout(() => {
      setQrUrl(buildQrSrc(dpsUrl));
      const t2 = setTimeout(() => setShowQr(true), 100);
      // clear t2 on cleanup
      return () => clearTimeout(t2);
    }, 200);

    return () => clearTimeout(t1);
  }, [authorized]);

  // Skip localStorage persistence for Claude artifacts
  useEffect(() => {
    // In a real app, this would save to localStorage
    // For Claude artifacts, we skip this to avoid errors
  }, [input]);

  const handleGenerate = (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = input.trim();
    if (!v) {
      setQrUrl(null);
      setImageError(false);
      setShowQr(false);
      return;
    }

    setIsLoading(true);
    setImageError(false);
    setShowQr(false);

    // Add a small delay to show loading state
    setTimeout(() => {
      setQrUrl(buildQrSrc(v));
      setIsLoading(false);
      setTimeout(() => setShowQr(true), 100);
    }, 500);
  };

  const handleClear = () => {
    setInput("");
    setQrUrl(null);
    setImageError(false);
    setIsLoading(false);
    setShowQr(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);

    // Try fallback service
    if (qrUrl && qrUrl.includes("qrserver.com")) {
      const value = input.trim();
      if (value) {
        setQrUrl(`https://chart.googleapis.com/chart?cht=qr&chs=400x400&chl=${encodeURIComponent(value)}&chld=L|1`);
      }
    }
  };

  const handleImageLoad = () => {
    setImageError(false);
    setIsLoading(false);
  };

  const normalized = normalizeUrl(input);
  const canOpen = isValidUrl(normalized);

  // If we haven't determined auth yet, render nothing to avoid flicker.
  if (authorized === null) {
    return null;
  }

  // If not authorized, render empty page (navigation already triggered in useEffect)
  if (authorized === false) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="w-full h-full bg-gradient-to-br from-blue-100/20 via-transparent to-purple-100/20 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10"></div>
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-600 bg-clip-text mb-4">Your QR Code</h1>
        </div>

        {/* QR Code Display Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 transition-all duration-300">
          {qrUrl ? (
            <div className="text-center space-y-8">
              {/* QR Code Container */}
              <div className="flex justify-center">
                {isLoading ? (
                  <div className="w-80 h-80 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-3xl flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 animate-pulse">
                    <div className="text-center space-y-4">
                      <svg className="animate-spin w-12 h-12 text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">Generating your QR code...</p>
                    </div>
                  </div>
                ) : imageError ? (
                  <div className="w-80 h-80 border-2 border-red-200 dark:border-red-800 rounded-3xl flex items-center justify-center bg-red-50 dark:bg-red-900/20 animate-fade-in">
                    <div className="text-center space-y-4 p-8">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-red-600 dark:text-red-400 font-semibold">Failed to generate QR code</p>
                        <p className="text-red-500 dark:text-red-400 text-sm mt-2">
                          Please try a different URL or check your connection
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`transition-all duration-700 transform ${showQr ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                      <div className="relative bg-white dark:bg-gray-900 p-2 rounded-3xl shadow-2xl border-4 border-white dark:border-emerald-700">
                        <img
                          src={qrUrl}
                          alt="Generated QR code"
                          width={320}
                          height={320}
                          onError={handleImageError}
                          onLoad={handleImageLoad}
                          className="rounded-2xl shadow-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!isLoading && !imageError && qrUrl && (
                <div
                  className={`hidden flex flex-col sm:flex-row gap-4 justify-center transition-all duration-500 ${showQr ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                  <a
                    href={qrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Download QR Code</span>
                  </a>

                  {canOpen && (
                    <a
                      href={normalized}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      <span>Open URL</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-12 h-12 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h.01M12 8h.01M12 8h4.01M12 8H7.99M12 8V4m0 0H7.99M12 4h4.01"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Ready to Generate</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Enter a URL or text above and click "Generate QR Code" to create your QR code.
              </p>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="mt-100 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 mb-8 transition-all duration-300 hover:shadow-2xl">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="relative">
              <div className="relative">
                <input
                  id="divQrInputField"
                  aria-label="URL or text to encode"
                  placeholder="https://example.com or any text..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                {input && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h.01M12 8h.01M12 8h4.01M12 8H7.99M12 8V4m0 0H7.99M12 4h4.01"
                      />
                    </svg>
                    <span>Generate QR Code</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                className="sm:w-auto bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50">
                Clear
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
