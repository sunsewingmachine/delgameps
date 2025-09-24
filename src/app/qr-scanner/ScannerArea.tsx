"use client";
import React from "react";

type CamPerm = "granted" | "denied" | "prompt";

type Props = {
	cameraPermission: CamPerm;
	scannedData: string | null;
	videoRef: React.RefObject<HTMLVideoElement | null>;
	canvasRef: React.RefObject<HTMLCanvasElement | null>;
	requestCameraPermission: () => Promise<void>;
	stopScanner: () => void;
};

export default function ScannerArea({
	cameraPermission,
	scannedData,
	videoRef,
	canvasRef,
	requestCameraPermission,
	stopScanner,
}: Props) {
	return (
		<>
			{cameraPermission === "prompt" && (
				<div className="space-y-6">
					<div className="w-64 h-64 mx-auto bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
						<div className="text-center">
							<div className="text-4xl mb-2">📷</div>
							<p className="text-gray-500 dark:text-gray-400 text-sm">QR Preview</p>
						</div>
					</div>
					<button
						onClick={requestCameraPermission}
						className="px-7 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 font-medium text-lg">
						Check Referer QR
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
							Camera permission is required. Use HTTPS (e.g., https://ngrok.com/ or https://localtunnel.github.io/www/)
							and allow camera access.
						</p>
						<button
							onClick={requestCameraPermission}
							className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 font-medium">
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
						className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium">
						Stop Scanning
					</button>
				</div>
			)}
		</>
	);
}
