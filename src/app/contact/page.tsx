"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/*
Purpose: Neutralized Contact page for PaySkill. Immediately redirects users to the login
screen to keep the app focused on the splash/login/home flow. (Under 100 words)
*/

export default function ContactPage() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/login");
	}, [router]);

	return null;
}
