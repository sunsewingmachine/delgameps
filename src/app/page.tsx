"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

/*
Purpose: Splash screen for PaySkill. Shows a simple centered title + spinner for 5 seconds,
then navigates to the login page. (Under 100 words)
*/

export default function SplashPage() {
	const router = useRouter();

	useEffect(() => {
		const t = setTimeout(() => {
			router.push("/login");
		}, 8000); // 5 seconds

		return () => clearTimeout(t);
	}, [router]);

	return (
		<div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-gray-900">
			<div className="text-center">
				<div
					aria-hidden
					className="mx-auto mb-6 h-20 w-20 rounded-full border-4 border-t-blue-500 border-gray-200 animate-spin"
				/>
				<h1 className="text-4xl font-semibold text-gray-900 dark:text-gray-100">PaySkill</h1>
				<p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Loading…</p>
			</div>
		</div>
	);
}
