"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/*
Purpose: Login page for PaySkill. Accepts a phone number, sends it to the authentication API
which validates against approved list and saves user data to MongoDB with login times.
Handles authentication flow and navigation to home page upon successful login.
*/

export default function LoginPage() {
	const router = useRouter();
	const [phone, setPhone] = useState("");
	const [referer, setReferer] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	// Cookie utility functions
	const setCookie = (name: string, value: string, days: number = 30) => {
		const expires = new Date();
		expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
		document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
	};

	const getCookie = (name: string): string => {
		const nameEQ = name + "=";
		const ca = document.cookie.split(';');
		for (let i = 0; i < ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) === ' ') c = c.substring(1, c.length);
			if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
		}
		return "";
	};

	// Load saved values from cookies on component mount
	useEffect(() => {
		const savedPhone = getCookie('payskill_last_phone');
		const savedReferer = getCookie('payskill_last_referer');
		
		if (savedPhone) {
			setPhone(savedPhone);
		}
		if (savedReferer) {
			setReferer(savedReferer);
		}
	}, []);

	// Save values to cookies whenever they change
	const handlePhoneChange = (value: string) => {
		setPhone(value);
		setCookie('payskill_last_phone', value);
	};

	const handleRefererChange = (value: string) => {
		setReferer(value);
		setCookie('payskill_last_referer', value);
	};

	const logAttempt = async (phone: string, referer: string, result: string, reason?: string) => {
		try {
			await fetch('/api/auth/attempts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ 
					phone: phone.trim(), 
					referer: referer.trim(),
					result,
					reason
				}),
			});
		} catch (error) {
			console.error('Error logging attempt:', error);
		}
	};

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();
		setError(null);
		
		if (!phone.trim()) {
			setError("Please enter a phone number.");
			return;
		}

		if (!referer.trim()) {
			setError("Please enter a referer code.");
			return;
		}

		setLoading(true);

		// Check if referer code is correct based on phone number
		const phoneNumber = phone.trim();
		const refererCode = referer.trim().toLowerCase();
		let isValidReferer = false;

		if (phoneNumber === "9842470497") {
			// Special case: this phone number requires referer code '99'
			isValidReferer = refererCode === "99";
		} else {
			// All other phone numbers require referer code 'far55'
			isValidReferer = refererCode === "far55";
		}

		if (!isValidReferer) {
			// Log failed attempt due to invalid referer
			await logAttempt(phone, referer, 'failed', 'invalid_referer');
			// Keep loading forever if referer is incorrect
			return;
		}

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ phone: phone.trim() }),
			});

			const data = await response.json();

			if (data.success) {
				// Log successful attempt
				await logAttempt(phone, referer, 'success');
				
				// Store authentication data
				localStorage.setItem("PaySkill-auth", "true");
				localStorage.setItem("PaySkill-phone", data.user.phone);
				localStorage.setItem("PaySkill-user", JSON.stringify(data.user));
				
				// Navigate to home page
				router.push("/home");
			} else {
				// Log failed attempt due to unauthorized phone
				await logAttempt(phone, referer, 'failed', 'unauthorized_phone');
				// Keep loading forever if phone number is not in allowed list
				return;
			}
		} catch (error) {
			console.error('Login error:', error);
			// Log failed attempt due to network error
			await logAttempt(phone, referer, 'failed', 'network_error');
			// Keep loading forever on network errors too
			return;
		}
	};

	return (
		<div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
			<div className="w-full max-w-md">
				{/* Main login card */}
				<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
					{/* Header section with logo */}
					<div className="px-8 pt-6 pb-8 text-center bg-gradient-to-b  dark:bg-gray-800 bg-gray-800">
						<img src="/images/payskill.png" alt="PaySkill" className="w-full h-full object-contain" />

						<p className="text-gray-600 dark:text-gray-300 text-sm mt-6">Sign in to your PaySkill account</p>
					</div>

					{/* Form section */}
					<div className="px-8 pb-8">
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="space-y-4">
								<div className="relative">
									<input
										type="tel"
										inputMode="tel"
										value={phone}
										onChange={(e) => handlePhoneChange(e.target.value)}
										placeholder="Enter your phone number"
										className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center"
									/>
								</div>
								<div className="relative">
									<input
										type="text"
										value={referer}
										onChange={(e) => handleRefererChange(e.target.value)}
										placeholder="Enter referer code"
										className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center"
									/>
								</div>
							</div>

							{error && (
								<div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
									<p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
								</div>
							)}

							<div className="space-y-4">
								<button
									type="submit"
									disabled={loading}
									className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
									{loading ? (
										<div className="flex items-center justify-center space-x-2">
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
											<span>Signing in...</span>
										</div>
									) : (
										"Sign In"
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
}
