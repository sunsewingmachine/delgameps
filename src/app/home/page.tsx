"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ITask, ITaskCompletion } from "@/lib/taskService";

/*
Purpose: Elegant home page for PaySkill displaying 10 skill-based tasks. Users can view
their task completion status and click on tasks to navigate to upload pages. Features
modern card-based design with task categories, difficulty levels, and completion tracking.
Updated to show tasks as "Task 1", "Task 2", etc. with specific task flow logic.
*/

export default function HomePage() {
	const router = useRouter();
	const [phone, setPhone] = useState<string | null>(null);
	const [checking, setChecking] = useState(true);
	const [tasks, setTasks] = useState<ITask[]>([]);
	const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(false);
	const [showPopup, setShowPopup] = useState(false);
	const [showCompletedPopup, setShowCompletedPopup] = useState(false);

	// Levels configuration loaded from public/levels.json.
	// Purpose: Provide per-phone-number overrides for which tasks are completed,
	// their display status text, and payment text (used to render Task cards).
	type LevelInfo = { completed: boolean; status: string; payment: string };
	const [levels, setLevels] = useState<Record<string, Record<string, LevelInfo>>>({});

	useEffect(() => {
		const auth = localStorage.getItem("PaySkill-auth");
		const p = localStorage.getItem("PaySkill-phone");
		if (auth === "true" && p) {
			setPhone(p);
			loadTasks();
			loadUserCompletions(p);
			setChecking(false);
		} else {
			router.replace("/login");
		}
	}, [router]);

	// Load levels.json for user-specific level/status/payment info
	const loadLevels = async () => {
		try {
			const res = await fetch('/levels.json');
			if (res.ok) {
				const data = await res.json();
				setLevels(data);
			}
		} catch (err) {
			console.error('Error loading levels.json', err);
		}
	};

	useEffect(() => {
		if (phone) {
			loadLevels();
		}
	}, [phone]);

	// Auto-complete Task 1 (Sign Up) when user first sees this page
	useEffect(() => {
		if (phone && tasks.length > 0 && !completedTasks.has(tasks[0]?.id)) {
			autoCompleteSignUpTask();
		}
	}, [phone, tasks, completedTasks]);

	const autoCompleteSignUpTask = async () => {
		if (!phone || tasks.length === 0) return;
		
		const signUpTask = tasks[0]; // First task is Sign Up
		try {
			const response = await fetch('/api/tasks/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					userId: phone,
					taskId: signUpTask.id,
					taskTitle: signUpTask.title,
					status: 'approved', // Mark as completed
					paymentStatus: 'allotted'
				}),
			});

			if (response.ok) {
				// Reload completions to reflect the change
				loadUserCompletions(phone);
			}
		} catch (error) {
			console.error('Error auto-completing sign up task:', error);
		}
	};

	const loadTasks = async () => {
		try {
			// Fetch tasks from API instead of direct service call
			const response = await fetch('/api/tasks/available');
			if (response.ok) {
				const availableTasks = await response.json();
				setTasks(availableTasks);
			} else {
				// Fallback to hardcoded tasks if API fails
				setTasks([]);
			}
		} catch (error) {
			console.error('Error loading tasks:', error);
			setTasks([]);
		}
	};

	const loadUserCompletions = async (userPhone: string) => {
		try {
			setLoading(true);
			const response = await fetch(`/api/tasks/completions?userId=${userPhone}`);
			if (response.ok) {
				const completions: ITaskCompletion[] = await response.json();
				const completedTaskIds = new Set(completions.map(c => c.taskId));
				setCompletedTasks(completedTaskIds);
			}
		} catch (error) {
			console.error("Error loading user completions:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("PaySkill-auth");
		localStorage.removeItem("PaySkill-phone");
		router.push("/login");
	};

	const handleTaskClick = (taskId: string, taskIndex: number) => {
		// Task 1 (index 0) - Show completed popup
		if (taskIndex === 0) {
			setShowCompletedPopup(true);
			return;
		}
		
		// Task 2 (index 1) - QR Code Scanner
		if (taskIndex === 1) {
			router.push('/qr-scanner');
			return;
		}
		
		// Task 3 (index 2) and beyond - Check if previous task is completed
		if (taskIndex >= 2) {
			const previousTaskId = tasks[taskIndex - 1]?.id;
			if (!completedTasks.has(previousTaskId)) {
				setShowPopup(true);
				return;
			}
		}
		
		// Default behavior for other tasks
		router.push(`/task/${taskId}`);
	};

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
			case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
			default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	};

	const getCategoryColor = (category: string) => {
		const colors = {
			'Life Skills': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
			'Communication': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			'Technical': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
			'Finance': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
			'Creative': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
			'Health': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
			'Education': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
			'Mental': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
			'Leadership': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
		};
		return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
	};

	if (checking) {
		return (
			<div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
				<div className="text-center">
					<div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-t-blue-500 border-gray-200 animate-spin" />
					<p className="text-lg text-gray-600 dark:text-gray-300">Loading PaySkill...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-y-auto">
			{/* Header */}
			<div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
								<span className="text-white font-bold text-lg">P</span>
							</div>
							<div>
								<h1 className="text-2xl font-bold text-gray-900 dark:text-white">PaySkill</h1>
								<p className="text-sm text-gray-600 dark:text-gray-400">Welcome back, {phone}</p>
							</div>
						</div>
						<button
							onClick={handleLogout}
							className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium"
							type="button"
						>
							Logout
						</button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Hero Section */}
				<div className="text-center mb-12">
					<h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
						Master New Skills
					</h2>
					<p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
						Complete real-world challenges, upload your proof videos, and get evaluated by our experts. 
						Start your skill journey today!
					</p>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
					<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
						<div className="flex items-center">
							<div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
								<span className="text-2xl">📋</span>
							</div>
							<div className="ml-4">
								<p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
								<p className="text-gray-600 dark:text-gray-400">Available Tasks</p>
							</div>
						</div>
					</div>
					<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
						<div className="flex items-center">
							<div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
								<span className="text-2xl">✅</span>
							</div>
							<div className="ml-4">
								<p className="text-2xl font-bold text-gray-900 dark:text-white">{completedTasks.size}</p>
								<p className="text-gray-600 dark:text-gray-400">Completed</p>
							</div>
						</div>
					</div>
					<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
						<div className="flex items-center">
							<div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
								<span className="text-2xl">🎯</span>
							</div>
							<div className="ml-4">
								<p className="text-2xl font-bold text-gray-900 dark:text-white">
									{Math.round((completedTasks.size / tasks.length) * 100)}%
								</p>
								<p className="text-gray-600 dark:text-gray-400">Progress</p>
							</div>
						</div>
					</div>
				</div>

				{/* Tasks Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{tasks.map((task, index) => {
						const taskNumber = index + 1;
						const isTask1 = index === 0; // Sign Up task
						const taskKey = `task-${taskNumber}`;
						const userLevels = (phone && levels[phone]) ? levels[phone] : (levels['default'] || {});
						const levelInfo = userLevels[taskKey] || {
							completed: completedTasks.has(task.id),
							status: completedTasks.has(task.id) ? 'Completed' : 'Pending',
							payment: (completedTasks.has(task.id) && isTask1) ? 'Allotted' : 'Pending'
						};
						const isCompleted = !!levelInfo.completed;
						
						return (
							<div
								key={task.id}
								onClick={() => handleTaskClick(task.id, index)}
								className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
									isCompleted 
										? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20' 
										: 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
								}`}
							>
								{/* Completion Status Icon */}
								<div className="flex justify-end mb-4">
									{isCompleted && (
										<div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
											<svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
											</svg>
										</div>
									)}
								</div>

								{/* Task Title */}
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
									Task {taskNumber} {isTask1 ? '(Sign Up)' : ''}
								</h3>

								{/* Status and Payment */}
								<div className="space-y-2">
									<div className="flex justify-between items-center">
										<span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
										<span className={`text-sm font-medium ${
											levelInfo.completed 
												? 'text-green-600 dark:text-green-400' 
												: 'text-gray-500 dark:text-gray-500'
										}`}>
											{levelInfo.status}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm text-gray-600 dark:text-gray-400">Payment:</span>
										<span className={`text-sm font-medium ${
											levelInfo.payment && levelInfo.payment.toLowerCase() === 'allotted'
												? 'text-green-600 dark:text-green-400'
												: 'text-gray-500 dark:text-gray-500'
										}`}>
											{levelInfo.payment || 'Pending'}
										</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{loading && (
					<div className="text-center mt-8">
						<div className="inline-block h-8 w-8 rounded-full border-4 border-t-blue-500 border-gray-200 animate-spin" />
						<p className="mt-2 text-gray-600 dark:text-gray-400">Loading your progress...</p>
					</div>
				)}
			</div>

			{/* Task Locked Popup */}
			{showPopup && (
				<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
					<div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-4 shadow-2xl">
						<div className="text-center">
							<div className="text-6xl mb-4">⚠️</div>
							<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
								Task Locked
							</h3>
							<p className="text-gray-600 dark:text-gray-400 mb-6">
								Please complete previous task first
							</p>
							<button
								onClick={() => setShowPopup(false)}
								className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 font-medium"
							>
								OK
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Task Completed Popup */}
			{showCompletedPopup && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-4 shadow-2xl">
						<div className="text-center">
							<div className="text-6xl mb-4">✅</div>
							<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
								Task Completed
							</h3>
							<p className="text-gray-600 dark:text-gray-400 mb-2">
								Congratulations! You have successfully completed Task 1 (Sign Up).
							</p>
							<p className="text-green-600 dark:text-green-400 font-medium mb-6">
								Payment Status: Allotted
							</p>
							<button
								onClick={() => setShowCompletedPopup(false)}
								className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 font-medium"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
