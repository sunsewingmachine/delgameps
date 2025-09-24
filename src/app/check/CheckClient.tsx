"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/*
Purpose:
Client-only component for the /check page. Validates query args (arg and ep),
shows a success panel with a button when validation passes, otherwise shows an
invalid message and redirects back to /home after 3 seconds.
*/
function parseEpochToMillis(raw: string) {
	const cleaned = raw?.trim();
	if (!cleaned || !/^\d+$/.test(cleaned)) return { ok: false, millis: null, date: null };

	const num = Number(cleaned);
	const millis = cleaned.length >= 13 || num > 1e12 ? num : num * 1000;
	const date = new Date(millis);
	if (isNaN(date.getTime())) return { ok: false, millis: null, date: null };
	return { ok: true, millis, date };
}

export default function CheckClient() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const arg = searchParams?.get("arg") ?? "";
	const ep = searchParams?.get("ep") ?? "";

	const expected = "far99-task2";
	const matches = arg === expected;

	const { ok: epValid, millis: epMillis, date: epDate } = parseEpochToMillis(ep);

	const isCurrentHour = useMemo(() => {
		if (!epValid || !epMillis) return false;
		const now = new Date();
		const startHour = new Date(now);
		startHour.setMinutes(0, 0, 0);
		const endHour = new Date(startHour.getTime() + 60 * 60 * 1000 - 1);
		return epMillis >= startHour.getTime() && epMillis <= endHour.getTime();
	}, [epValid, epMillis]);

	const allGood = matches && epValid && isCurrentHour;

	const [showValidDiv, setShowValidDiv] = useState(false);

	useEffect(() => {
		if (allGood) {
			// When validation passes, show a loading state for 10s, then reveal the action panel.
			setShowValidDiv(false);
			const t = setTimeout(() => setShowValidDiv(true), 25000);
			return () => clearTimeout(t);
		}
		// Ensure panel is hidden when validation isn't satisfied.
		setShowValidDiv(false);
	}, [allGood]);

	useEffect(() => {
		if (!allGood) {
			// If anything is missing/wrong, redirect to Home page after 3 seconds.
			const t = setTimeout(() => {
				// Prefer router.push(); fallback to window.location for safety
				try {
					router.push("/home");
				} catch (e) {
					if (typeof window !== "undefined") window.location.href = "/home";
				}
			}, 3000);
			return () => clearTimeout(t);
		}
		return;
	}, [allGood, router]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-y-auto">
			{/* Header (matching home page style) */}
			<div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
								<span className="text-white font-bold text-lg">P</span>
							</div>
							<div>
								<h1 className="text-2xl font-bold text-gray-900 dark:text-white">PaySkill — Check</h1>
								<p className="text-sm text-gray-600 dark:text-gray-400">Validation page for special links</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="text-center mb-8">
					<h2 className="text-3xl font-bold text-gray-900 dark:text-white">Your Next Skill...</h2>
					<p className="text-gray-600 dark:text-gray-300 mt-2">
						Checking the QR of Referer and loading your skill task...
					</p>
				</div>

				<section className="max-w-3xl mx-auto">
					<div className="mb-6 hidden">
						<strong className="text-sm text-gray-700 dark:text-gray-300">Raw query</strong>
						<pre className="mt-2 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-left break-words">
							{`?arg=${arg}${ep ? `&ep=${ep}` : ""}`}
						</pre>
					</div>

					{allGood ? (
						showValidDiv ? (
							<div
								id="divValidEpochAction"
								className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-green-300 dark:border-green-600">
								<p className="text-lg text-gray-900 dark:text-slate-300">Referer: Valid</p>

								<p className="mt-3 text-xl font-semibold text-gray-600 dark:text-green-400">
									Your Next Task: Arm Wrestling
								</p>

								<div className="mt-10">
									<p>Rules</p>
									<div>
										<strong>Start:</strong> Elbows on pad, hands gripped, wrists straight.
									</div>
									<div>
										<strong>Go:</strong> Begin only at referee’s signal.
									</div>
									<div>
										<strong>Win:</strong> Pin opponent’s hand to pad.
									</div>
									<div>
										<strong>Fouls:</strong> Elbow lift, false start, two-hand use, illegal lean.
									</div>
									<div>
										<strong>Fair Play:</strong> No wrist twists; follow referee.
									</div>
								</div>

								<p className="mt-3 text-sm text-gray-600 dark:text-gray-300 hidden">
									Interpreted time:{" "}
									<code className="bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded">
										{epDate?.toLocaleString() ?? "Invalid date"}
									</code>
								</p>

								<div className="mt-6">
									<button
										id="buttonProceedFromEpoch"
										onClick={() => {
											try {
												// Navigate to the Home page
												router.push("/home");
											} catch {
												// Fallback in case router isn't available (unexpected)
												if (typeof window !== "undefined") window.location.href = "/home";
											}
										}}
										className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold">
										I've Completed
									</button>
								</div>
							</div>
						) : (
							<div id="divValidEpochActionLoading" className="flex items-center justify-center">
								<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-green-300 dark:border-green-600 flex flex-col items-center">
									<svg
										className="w-12 h-12 text-green-600 animate-spin"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24">
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
									</svg>
									<p className="mt-3 text-gray-600 dark:text-gray-300">Preparing your task...</p>
								</div>
							</div>
						)
					) : (
						<div
							id="divInvalid"
							className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-red-200 dark:border-red-600">
							<p className="text-lg font-bold text-red-600 dark:text-red-300">Invalid QR Code</p>

							<ul className="hidden mt-3 list-disc list-inside text-gray-600 dark:text-gray-300">
								{!arg && (
									<li>
										No <code>arg</code> provided.
									</li>
								)}
								{arg && !matches && (
									<li>
										Provided <code>arg</code> does not match expected value <code>{expected}</code>.
									</li>
								)}
								{!ep && (
									<li>
										No <code>ep</code> provided.
									</li>
								)}
								{ep && !epValid && (
									<li>
										<code>ep</code> is not a valid numeric epoch (seconds or milliseconds).
									</li>
								)}
								{ep && epValid && !isCurrentHour && (
									<li>
										<code>ep</code> is not within the current hour.
									</li>
								)}
							</ul>

							<p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Please scan a valid QR Code...</p>
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
