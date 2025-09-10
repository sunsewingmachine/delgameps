import { Db, Collection, ObjectId } from 'mongodb';
import connectToDatabase from './mongodb';

/*
Purpose: Task service for PaySkill app. Manages user task completions and video uploads.
Handles task progress tracking, video metadata storage, and evaluation status management
for skill-based tasks in the PaySkill platform.
*/

export interface ITaskCompletion {
  _id?: ObjectId;
  userId: string; // phone number for now
  taskId: string;
  taskTitle: string;
  videoFileName?: string;
  videoPath?: string;
  status: 'under_evaluation' | 'approved' | 'rejected';
  paymentStatus?: 'pending' | 'allotted' | 'paid';
  uploadedAt: Date;
  evaluatedAt?: Date;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  icon: string;
}

export class TaskService {
  private static async getTaskCompletionCollection(): Promise<Collection<ITaskCompletion>> {
    const { db } = await connectToDatabase();
    return db.collection<ITaskCompletion>('task_completions');
  }

  static async createTaskCompletion(
    userId: string,
    taskId: string,
    taskTitle: string,
    videoFileName?: string,
    videoPath?: string,
    status?: 'under_evaluation' | 'approved' | 'rejected',
    paymentStatus?: 'pending' | 'allotted' | 'paid'
  ): Promise<ITaskCompletion> {
    const collection = await this.getTaskCompletionCollection();
    const now = new Date();
    
    const newCompletion: Omit<ITaskCompletion, '_id'> = {
      userId,
      taskId,
      taskTitle,
      videoFileName,
      videoPath,
      status: status || 'under_evaluation',
      paymentStatus,
      uploadedAt: now,
      createdAt: now,
      updatedAt: now
    };

    const result = await collection.insertOne(newCompletion);
    return {
      _id: result.insertedId,
      ...newCompletion
    };
  }

  static async getUserTaskCompletions(userId: string): Promise<ITaskCompletion[]> {
    const collection = await this.getTaskCompletionCollection();
    return await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async getTaskCompletion(userId: string, taskId: string): Promise<ITaskCompletion | null> {
    const collection = await this.getTaskCompletionCollection();
    return await collection.findOne({ userId, taskId });
  }

  static async updateTaskStatus(
    completionId: ObjectId,
    status: 'approved' | 'rejected',
    feedback?: string
  ): Promise<ITaskCompletion | null> {
    const collection = await this.getTaskCompletionCollection();
    const now = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: completionId },
      { 
        $set: { 
          status,
          feedback,
          evaluatedAt: now,
          updatedAt: now
        }
      },
      { returnDocument: 'after' }
    );

    return result;
  }

  static async createIndexes(): Promise<void> {
    const collection = await this.getTaskCompletionCollection();
    
    // Create indexes for faster queries
    await collection.createIndex({ userId: 1 });
    await collection.createIndex({ taskId: 1 });
    await collection.createIndex({ userId: 1, taskId: 1 }, { unique: true });
    await collection.createIndex({ status: 1 });
  }

  // Predefined tasks for the platform
  static getAvailableTasks(): ITask[] {
    return [
      {
        id: 'cooking-basic-meal',
        title: 'Cook a Basic Meal',
        description: 'Prepare and cook a simple, nutritious meal from scratch',
        category: 'Life Skills',
        difficulty: 'beginner',
        estimatedTime: '30-45 minutes',
        icon: '🍳'
      },
      {
        id: 'public-speaking',
        title: 'Public Speaking',
        description: 'Deliver a 3-minute speech on a topic of your choice',
        category: 'Communication',
        difficulty: 'intermediate',
        estimatedTime: '15-20 minutes',
        icon: '🎤'
      },
      {
        id: 'basic-coding',
        title: 'Write Basic Code',
        description: 'Create a simple program that solves a basic problem',
        category: 'Technical',
        difficulty: 'beginner',
        estimatedTime: '45-60 minutes',
        icon: '💻'
      },
      {
        id: 'financial-budgeting',
        title: 'Create a Budget Plan',
        description: 'Design a monthly budget plan with income and expense tracking',
        category: 'Finance',
        difficulty: 'intermediate',
        estimatedTime: '20-30 minutes',
        icon: '💰'
      },
      {
        id: 'creative-art',
        title: 'Create Artwork',
        description: 'Draw, paint, or create any form of visual art',
        category: 'Creative',
        difficulty: 'beginner',
        estimatedTime: '30-60 minutes',
        icon: '🎨'
      },
      {
        id: 'fitness-routine',
        title: 'Complete Workout',
        description: 'Perform a 20-minute fitness routine or exercise session',
        category: 'Health',
        difficulty: 'beginner',
        estimatedTime: '20-30 minutes',
        icon: '💪'
      },
      {
        id: 'language-learning',
        title: 'Language Practice',
        description: 'Practice speaking a foreign language for 10 minutes',
        category: 'Education',
        difficulty: 'intermediate',
        estimatedTime: '10-15 minutes',
        icon: '🗣️'
      },
      {
        id: 'problem-solving',
        title: 'Solve a Puzzle',
        description: 'Complete a challenging puzzle or brain teaser',
        category: 'Mental',
        difficulty: 'intermediate',
        estimatedTime: '15-30 minutes',
        icon: '🧩'
      },
      {
        id: 'music-performance',
        title: 'Musical Performance',
        description: 'Play an instrument or sing a song for 3 minutes',
        category: 'Creative',
        difficulty: 'intermediate',
        estimatedTime: '10-15 minutes',
        icon: '🎵'
      },
      {
        id: 'leadership-task',
        title: 'Leadership Challenge',
        description: 'Organize and lead a small group activity or project',
        category: 'Leadership',
        difficulty: 'advanced',
        estimatedTime: '45-60 minutes',
        icon: '👥'
      }
    ];
  }
}
