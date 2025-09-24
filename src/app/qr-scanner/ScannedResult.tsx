"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  scannedData: string;
  onComplete: () => void;
};

export default function ScannedResult({ scannedData, onComplete }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!scannedData) return;

    // If scannedData contains the specific task string, navigate to it.
    if (scannedData.includes("far99-task2")) {
      const url = /^https?:\/\//i.test(scannedData) ? scannedData : `https://${scannedData}`;
      // Use window.location to ensure a full navigation outside of the SPA router when necessary.
      window.location.href = url;
      return;
    }

    // Otherwise return to previous page
    router.back();
  }, [scannedData, router]);

  const handleContinue = () => {
    if (scannedData && scannedData.includes("far99-task2")) {
      const url = /^https?:\/\//i.test(scannedData) ? scannedData : `https://${scannedData}`;
      window.location.href = url;
      return;
    }
    // Call onComplete as a fallback and navigate back
    try {
      onComplete();
    } catch (e) {
      // ignore if onComplete is not critical
    }
    router.back();
  };

  return (
    <div className="space-y-6">
      <div className="w-64 h-64 mx-auto bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center border-2 border-dashed border-green-300 dark:border-green-600">
        <div className="text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-green-500 dark:text-green-400 text-sm">QR Code Scanned!</p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-w-md mx-auto">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Redirecting...</p>
        {/* Scanned text/URL intentionally hidden for privacy */}
      </div>

      <button
        onClick={handleContinue}
        className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 font-medium text-lg"
      >
        Continue
      </button>
    </div>
  );
}
