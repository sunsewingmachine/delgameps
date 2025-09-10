"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ITask, ITaskCompletion } from "@/lib/taskService";

/*
Purpose: Task detail page for PaySkill where users can view task information and upload
proof videos. Features video upload functionality, task completion tracking, and elegant
UI with back navigation to home page.
*/

export default function TaskDetailPage() {
	const router = useRouter();
	const params = useParams();
	const taskId = params.taskId as string;
	
	const [phone, setPhone] = useState<string | null>(null);
	const [checking, setChecking] = useState(true);
	const [task, setTask] = useState<ITask | null>(null);
	const [completion, setCompletion] = useState<ITaskCompletion | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadSuccess, setUploadSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const auth = localStorage.getItem("PaySkill-auth");
		const p = localStorage.getItem("PaySkill-phone");
		if (auth === "true" && p) {
			setPhone(p);
			loadTask();
			loadTaskCompletion(p);
			setChecking(false);
		} else {
			router.replace("/login");
		}
	}, [router, taskId]);

	const loadTask = async () => {
		try {
			const response = await fetch('/api/tasks/available');
			if (response.ok) {
				const availableTasks = await response.json();
				const foundTask = availableTasks.find((t: ITask) => t.id === taskId);
				setTask(foundTask || null);
			}
		} catch (error) {
			console.error('Error loading task:', error);
			setTask(null);
		}
	};

	const loadTaskCompletion = async (userPhone: string) => {
		try {
			const response = await fetch(`/api/tasks/completions?userId=${userPhone}`);
			if (response.ok) {
				const completions: ITaskCompletion[] = await response.json();
				const taskCompletion = completions.find(c => c.taskId === taskId);
				setCompletion(taskCompletion || null);
			}
		} catch (error) {
			console.error("Error loading task completion:", error);
		}
	};

	const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file || !phone || !task) return;

		// Validate file type
		if (!file.type.startsWith('video/')) {
			setError('Please select a valid video file');
			return;
		}

		// Validate file size (50MB limit)
		const maxSize = 50 * 1024 * 1024; // 50MB
		if (file.size > maxSize) {
			setError('Video file size must be less than 50MB');
			return;
		}

		setUploading(true);
		setError(null);

		try {
			// Upload video file
			const formData = new FormData();
			formData.append('video', file);
			formData.append('userId', phone);
			formData.append('taskId', task.id);

			const uploadResponse = await fetch('/api/upload/video', {
				method: 'POST',
				body: formData,
			});

			if (!uploadResponse.ok) {
				const uploadError = await uploadResponse.json();
				setError(uploadError.error || 'Failed to upload video');
				return;
			}

			const uploadResult = await uploadResponse.json();

			// Create task completion record
			const completionResponse = await fetch('/api/tasks/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					userId: phone,
					taskId: task.id,
					taskTitle: task.title,
					videoFileName: uploadResult.fileName,
					videoPath: uploadResult.filePath,
				}),
			});

			if (completionResponse.ok) {
				const newCompletion = await completionResponse.json();
				setCompletion(newCompletion);
				setUploadSuccess(true);
				
				// Reset file input
				event.target.value = '';
			} else {
				const errorData = await completionResponse.json();
				setError(errorData.error || 'Failed to save task completion');
			}
		} catch (error) {
			console.error('Upload error:', error);
			setError('Failed to upload video. Please try again.');
		} finally {
			setUploading(false);
		}
	};

	const handleBackToHome = () => {
		router.push('/home');
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

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'under_evaluation': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
			case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
			default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	};

	if (checking) {
		return (
			<div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
				<div className="text-center">
					<div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-t-blue-500 border-gray-200 animate-spin" />
					<p className="text-lg text-gray-600 dark:text-gray-300">Loading task...</p>
				</div>
			</div>
		);
	}

	if (!task) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
				<div className="text-center">
					<div className="text-6xl mb-4">❌</div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Task Not Found</h1>
					<p className="text-gray-600 dark:text-gray-400 mb-6">The requested task could not be found.</p>
					<button
						onClick={handleBackToHome}
						className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 font-medium"
					>
						Back to Home
					</button>
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
								<p className="text-sm text-gray-600 dark:text-gray-400">Task Details</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Task Header */}
				<div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
					<div className="flex items-start justify-between mb-6">
						<div className="flex items-center space-x-4">
							<div className="text-6xl">{task.icon}</div>
							<div>
								<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
									{task.title}
								</h1>
								<div className="flex flex-wrap gap-2">
									<span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(task.category)}`}>
										{task.category}
									</span>
									<span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(task.difficulty)}`}>
										{task.difficulty}
									</span>
								</div>
							</div>
						</div>
						{completion && (
							<div className="text-right">
								<span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(completion.status)}`}>
									{completion.status.replace('_', ' ').toUpperCase()}
								</span>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
									Uploaded: {new Date(completion.uploadedAt).toLocaleDateString()}
								</p>
							</div>
						)}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
							<p className="text-gray-600 dark:text-gray-400 leading-relaxed">
								{task.description}
							</p>
						</div>
						<div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Time Estimate</h3>
							<div className="flex items-center text-gray-600 dark:text-gray-400">
								<svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
								</svg>
								{task.estimatedTime}
							</div>
						</div>
					</div>
				</div>

				{/* Upload Section */}
				<div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
						{completion ? 'Task Completed' : 'Upload Your Proof Video'}
					</h2>

					{completion ? (
						<div className="text-center py-8">
							<div className="text-6xl mb-4">✅</div>
							<h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
								Video Uploaded Successfully!
							</h3>
							<p className="text-gray-600 dark:text-gray-400 mb-4">
								Your video is now under evaluation. You'll be notified once the review is complete.
							</p>
							<div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-w-md mx-auto">
								<div className="flex justify-between items-center mb-2">
									<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
									<span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(completion.status)}`}>
										{completion.status.replace('_', ' ').toUpperCase()}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploaded:</span>
									<span className="text-sm text-gray-600 dark:text-gray-400">
										{new Date(completion.uploadedAt).toLocaleString()}
									</span>
								</div>
							</div>
						</div>
					) : (
						<div>
							<div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
								<div className="text-4xl mb-4">📹</div>
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
									Upload Your Video Proof
								</h3>
								<p className="text-gray-600 dark:text-gray-400 mb-6">
									Record a video demonstrating your completion of this task. 
									Maximum file size: 50MB. Supported formats: MP4, MOV, AVI, WebM.
								</p>
								
								<div className="max-w-xs mx-auto">
									<input
										type="file"
										accept="video/*"
										onChange={handleVideoUpload}
										disabled={uploading}
										className="hidden"
										id="video-upload"
									/>
									<label
										htmlFor="video-upload"
										className={`block w-full px-6 py-3 rounded-lg font-medium transition-colors duration-200 cursor-pointer ${
											uploading
												? 'bg-gray-400 text-gray-700 cursor-not-allowed'
												: 'bg-blue-500 hover:bg-blue-600 text-white'
										}`}
									>
										{uploading ? (
											<div className="flex items-center justify-center">
												<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
												Uploading...
											</div>
										) : (
											'Choose Video File'
										)}
									</label>
								</div>
							</div>

							{error && (
								<div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
									<div className="flex items-center">
										<svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
										</svg>
										<p className="text-red-700 dark:text-red-300">{error}</p>
									</div>
								</div>
							)}

							{uploadSuccess && (
								<div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
									<div className="flex items-center">
										<svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
										</svg>
										<p className="text-green-700 dark:text-green-300">
											Video uploaded successfully! Your task is now under evaluation.
										</p>
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
