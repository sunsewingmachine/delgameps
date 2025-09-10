import { NextResponse } from 'next/server';
import { TaskService } from '@/lib/taskService';

/*
Purpose: API endpoint for retrieving available tasks in PaySkill. Returns the list of
10 predefined skill-based tasks with their metadata including categories, difficulty
levels, descriptions, and time estimates.
*/

export async function GET() {
  try {
    const tasks = TaskService.getAvailableTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching available tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available tasks' },
      { status: 500 }
    );
  }
}
