"use client";
import React, { useState, useEffect } from "react";
import "./globals.css";

/*
Purpose: Root layout for the PaySkill app. Provides the global full-screen structure
(without a sidebar) and manages dark mode preferences. Ensures the app renders as an
SPA without visible scrollbars by preventing overflow. (Under 100 words)
*/

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const [darkMode, setDarkMode] = useState(false);

	useEffect(() => {
		// Initialize dark mode based on system preference or saved preference
		const savedTheme = localStorage.getItem("theme");
		const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

		if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
			setDarkMode(true);
			document.documentElement.classList.add("dark");
		} else {
			setDarkMode(false);
			document.documentElement.classList.remove("dark");
		}

		// Listen for system theme changes
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = (e: MediaQueryListEvent) => {
			if (localStorage.getItem("theme") === null) {
				setDarkMode(e.matches);
				if (e.matches) {
					document.documentElement.classList.add("dark");
				} else {
					document.documentElement.classList.remove("dark");
				}
			}
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	const toggleDarkMode = () => {
		setDarkMode((prev) => {
			const newMode = !prev;
			if (newMode) {
				document.documentElement.classList.add("dark");
				localStorage.setItem("theme", "dark");
			} else {
				document.documentElement.classList.remove("dark");
				localStorage.setItem("theme", "light");
			}
			return newMode;
		});
	};

	return (
		<html lang="en" className="h-full">
			<head>
				<title>PaySkill</title>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</head>
			<body
				className={`antialiased h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 ${
					darkMode ? "dark" : ""
				} overflow-hidden`}>
				<main className="h-full w-full overflow-hidden">
					{/* Main app area: full-screen, single-page app, no visible scrollbars */}
					<div className="h-full w-full overflow-hidden">{children}</div>
				</main>
			</body>
		</html>
	);
}
