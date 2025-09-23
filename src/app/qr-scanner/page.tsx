"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";

/*
Purpose: QR Code Scanner page for PaySkill Task 2. Allows users to scan referrer's QR codes
using their device camera. Features modern UI with camera access, QR code detection, and
navigation back to home page.
*/

export default function QRScannerPage() {
	const router = useRouter();
	const [phone, setPhone] = useState<string | null>(null);
	const [checking, setChecking] = useState(true);
	const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
	const [scanning, setScanning] = useState(false);
	const [scannedData, setScannedData] = useState<string | null>(null);

	const videoRef = useRef<HTMLVideoElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const detectorRef = useRef<any>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const animationRef = useRef<number | null>(null);

	const TARGET_QR = "REFERRER_QR_CODE_12345";

	const stopScanner = useCallback(() => {
		setScanning(false);
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
			animationRef.current = null;
		}
		if (streamRef.current) {
			streamRef.current.getTracks().forEach(t => t.stop());
			streamRef.current = null;
		}
		if (videoRef.current) {
			try { videoRef.current.pause(); videoRef.current.srcObject = null; } catch (e) {}
		}
	}, []);

	useEffect(() => {
		const auth = localStorage.getItem("PaySkill-auth");
		const p = localStorage.getItem("PaySkill-phone");
		if (auth === "true" && p) {
			setPhone(p);
			setChecking(false);
		} else {
			router.replace("/login");
		}
	}, [router]);

	// Clean up any active camera / animation frames when component unmounts
	useEffect(() => {
		return () => {
			stopScanner();
		};
	}, [stopScanner]);

	const handleBackToHome = () => {
		router.push('/home');
	};

	const requestCameraPermission = async () => {
		// Guard: ensure getUserMedia is available (avoids "reading 'getUserMedia'" runtime error)
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			console.error('getUserMedia is not available in this browser or context.');
			setCameraPermission('denied');
			// Inform the tester how to fix (secure context required for camera on remote devices)
			alert('Camera not available. getUserMedia requires a secure context (HTTPS) or localhost. To test from a phone, expose your dev server over HTTPS (for example with ngrok or localtunnel) and open that URL on your device.');
			return;
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment' }
			});
			// keep stream ref so we can stop later
			streamRef.current = stream;
			setCameraPermission('granted');
			setScanning(true);

			// attach stream to video element
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				videoRef.current.muted = true;
				videoRef.current.playsInline = true;
				await videoRef.current.play().catch(() => {});
			}

			// Prefer native BarcodeDetector when available
			const BarcodeDetectorClass = (window as any).BarcodeDetector;
			if (BarcodeDetectorClass) {
				try {
					detectorRef.current = new BarcodeDetectorClass({ formats: ['qr_code'] });
				} catch (e) {
					detectorRef.current = null;
				}
			} else {
				detectorRef.current = null;
			}

			// Frame detection loop
			const detectFrame = async () => {
				if (!scanning || !videoRef.current || !canvasRef.current) return;

				try {
					const video = videoRef.current;
					const canvas = canvasRef.current;
					const ctx = canvas.getContext('2d');

					// Wait for video to be ready
					if (video.readyState !== video.HAVE_ENOUGH_DATA) {
						animationRef.current = requestAnimationFrame(detectFrame);
						return;
					}

					// Try using native detector first if available
					if (detectorRef.current) {
						try {
							const detections = await detectorRef.current.detect(video);
							if (detections && detections.length > 0) {
								const value = detections[0].rawValue || detections[0].data || '';
								if (value) {
									setScannedData(value);
									
									if (value === TARGET_QR) {
										alert('QR matched expected referrer code.');
									} else {
										alert(`Scanned QR: ${value}`);
									}

									stopScanner();
									return;
								}
							}
						} catch (detectorError) {
							console.log('Native detector failed, falling back to jsQR');
						}
					}

					// Fallback to jsQR
					if (ctx && video.videoWidth && video.videoHeight) {
						canvas.width = video.videoWidth;
						canvas.height = video.videoHeight;
						ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
						const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
						
						const code = jsQR(imageData.data, imageData.width, imageData.height);
						if (code && code.data) {
							setScannedData(code.data);
							
							if (code.data === TARGET_QR) {
								alert('QR matched expected referrer code.');
							} else {
								alert(`Scanned QR: ${code.data}`);
							}

							stopScanner();
							return;
						}
					}
				} catch (e) {
					console.error('Error during QR detection loop', e);
				}

				// Continue scanning
				if (scanning) {
					animationRef.current = requestAnimationFrame(detectFrame);
				}
			};

			// start detection loop
			animationRef.current = requestAnimationFrame(detectFrame);

		} catch (error) {
			console.error('Camera permission denied:', error);
			setCameraPermission('denied');
		}
	};

	const handleScanComplete = () => {
		// In a real implementation, you would process the scanned QR code data
		// For now, we'll just navigate back to home
		router.push('/home');
	};

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

			{/* Main Content */}
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
					<div className="text-center">
						<div className="text-6xl mb-6">📱</div>
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
							Scan Referrer's QR Code
						</h1>
						<p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
							Position the QR code within the camera frame to scan it. Make sure the code is clearly visible and well-lit.
						</p>

						{/* Camera Permission States */}
						{cameraPermission === 'prompt' && (
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

						{cameraPermission === 'denied' && (
							<div className="space-y-6">
								<div className="w-64 h-64 mx-auto bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center border-2 border-dashed border-red-300 dark:border-red-600">
									<div className="text-center">
										<div className="text-4xl mb-2">❌</div>
										<p className="text-red-500 dark:text-red-400 text-sm">Camera Access Denied</p>
									</div>
								</div>
								<div className="text-center">
									<p className="text-gray-600 dark:text-gray-400 mb-4">
										Camera permission is required to scan QR codes. Please enable camera access in your browser settings and try again.
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

						{scanning && (
							<div className="space-y-6">
								<div className="w-80 h-80 mx-auto bg-black rounded-xl relative overflow-hidden border-2 border-blue-300 dark:border-blue-600">
									{/* video preview */}
									<video
										ref={videoRef}
										className="w-full h-full object-cover rounded-xl"
										playsInline
										muted
										autoPlay
									/>
									{/* Scanning overlay - only corners visible */}
									<div className="absolute inset-4 pointer-events-none">
										{/* Corner indicators */}
										<div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-blue-400"></div>
										<div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-blue-400"></div>
										<div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-blue-400"></div>
										<div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-blue-400"></div>
									</div>
									{/* Status indicator at bottom */}
									<div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
										<div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center">
											<div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
											Scanning...
										</div>
									</div>
								</div>

								{/* Hidden canvas used for fallback detection */}
								<canvas ref={canvasRef} style={{ display: 'none' }} />

								<div className="flex items-center justify-center">
									<div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
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
									<p className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border break-all">
										{scannedData}
									</p>
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

				{/* Instructions */}
				<div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
					<h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
						📋 Scanning Tips
					</h3>
					<ul className="space-y-2 text-blue-800 dark:text-blue-200">
						<li className="flex items-start">
							<span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
							Hold your device steady and ensure good lighting
						</li>
						<li className="flex items-start">
							<span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
							Position the QR code within the camera frame
						</li>
						<li className="flex items-start">
							<span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
							Make sure the QR code is not blurry or damaged
						</li>
						<li className="flex items-start">
							<span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
							Keep the camera at an appropriate distance from the code
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
