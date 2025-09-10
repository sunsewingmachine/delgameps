"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/*
Purpose: Home page for PaySkill. Verifies local auth flag, displays a welcome message
with the logged-in phone number and provides a logout button that clears auth and returns
to the login screen. (Under 100 words)
*/

export default function HomePage() {
	const router = useRouter();
	const [phone, setPhone] = useState<string | null>(null);
	const [checking, setChecking] = useState(true);

	useEffect(() => {
		const auth = localStorage.getItem("PaySkill-auth");
		const p = localStorage.getItem("PaySkill-phone");
		if (auth === "true" && p) {
			setPhone(p);
			setChecking(false);
		} else {
			// Not authenticated -> redirect to login
			router.replace("/login");
		}
	}, [router]);

	const handleLogout = () => {
		localStorage.removeItem("PaySkill-auth");
		localStorage.removeItem("PaySkill-phone");
		router.push("/login");
	};

	if (checking) {
		return (
			<div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-gray-900">
				<div className="text-center">
					<div className="mx-auto mb-4 h-8 w-8 rounded-full border-4 border-t-blue-500 border-gray-200 animate-spin" />
					<p className="text-sm text-gray-600 dark:text-gray-300">Verifying session…</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
				<h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Welcome to PaySkill</h1>
				<p className="mt-2 text-gray-700 dark:text-gray-300">
					You are signed in with phone: <span className="font-mono">{phone}</span>
				</p>
				<div className="mt-6">
					<p className="text-gray-600 dark:text-gray-400">
						This is the home screen. Replace this area with your app content.
					</p>
				</div>
				<div className="mt-6 flex items-center gap-3">
					<button onClick={handleLogout} className="px-4 py-2 rounded bg-red-600 text-white" type="button">
						Logout
					</button>
				</div>
			</div>
		</div>
	);
}
