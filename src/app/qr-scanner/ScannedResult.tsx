"use client";
import React from "react";

type Props = {
  scannedData: string;
  onComplete: () => void;
};

export default function ScannedResult({ scannedData, onComplete }: Props) {
  return (
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
        onClick={onComplete}
        className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 font-medium text-lg"
      >
        Complete Task
      </button>
    </div>
  );
}
