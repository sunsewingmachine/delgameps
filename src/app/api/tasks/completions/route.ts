import { NextRequest, NextResponse } from 'next/server';
import { TaskService } from '@/lib/taskService';

/*
Purpose: API endpoint for managing task completions in PaySkill. Handles GET requests
to retrieve user task completions and POST requests to create new task completion records
when users upload videos for skill verification.
*/

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const completions = await TaskService.getUserTaskCompletions(userId);
    return NextResponse.json(completions);
  } catch (error) {
    console.error('Error fetching task completions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task completions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, taskId, taskTitle, videoFileName, videoPath, status, paymentStatus } = body;

    if (!userId || !taskId || !taskTitle) {
      return NextResponse.json(
        { error: 'User ID, task ID, and task title are required' },
        { status: 400 }
      );
    }

    // Check if task completion already exists
    const existingCompletion = await TaskService.getTaskCompletion(userId, taskId);
    if (existingCompletion) {
      return NextResponse.json(
        { error: 'Task already completed by this user' },
        { status: 409 }
      );
    }

    const completion = await TaskService.createTaskCompletion(
      userId,
      taskId,
      taskTitle,
      videoFileName,
      videoPath,
      status,
      paymentStatus
    );

    return NextResponse.json(completion, { status: 201 });
  } catch (error) {
    console.error('Error creating task completion:', error);
    return NextResponse.json(
      { error: 'Failed to create task completion' },
      { status: 500 }
    );
  }
}
