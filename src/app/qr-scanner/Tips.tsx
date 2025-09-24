"use client";
import React from "react";

export default function Tips() {
  return (
    <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">📋 Rules/Tips:</h3>
      <ul className="space-y-2 text-blue-800 dark:text-blue-200">
        <li className="flex items-start">
          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
          Use direct phone QR, Must not use image
        </li>
        <li className="flex items-start">
          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
          Keep the code in the frame
        </li>
        <li className="flex items-start">
          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
          Hold steady, Avoid blur
        </li>
        <li className="flex items-start">
          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
          Use proper distance
        </li>
      </ul>
    </div>
  );
}
