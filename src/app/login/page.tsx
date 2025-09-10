"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

/*
Purpose: Login page for PaySkill. Accepts a phone number, sends it to the authentication API
which validates against approved list and saves user data to MongoDB with login times.
Handles authentication flow and navigation to home page upon successful login.
*/

export default function LoginPage() {
	const router = useRouter();
	const [phone, setPhone] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();
		setError(null);
		
		if (!phone.trim()) {
			setError("Please enter a phone number.");
			return;
		}

		setLoading(true);

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
				// Store authentication data
				localStorage.setItem("PaySkill-auth", "true");
				localStorage.setItem("PaySkill-phone", data.user.phone);
				localStorage.setItem("PaySkill-user", JSON.stringify(data.user));
				
				// Navigate to home page
				router.push("/home");
			} else {
				setError(data.error || "Login failed. Please try again.");
			}
		} catch (error) {
			console.error('Login error:', error);
			setError("Network error. Please check your connection and try again.");
		} finally {
			setLoading(false);
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
							<div className="space-y-2">
								<div className="relative">
									<input
										type="tel"
										inputMode="tel"
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
										placeholder="Enter your phone number"
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
