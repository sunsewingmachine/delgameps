import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/*
Purpose: API endpoint for handling video file uploads in PaySkill. Processes multipart
form data, validates video files, stores them in the uploads directory, and returns
file metadata for database storage.
*/

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File;
    const userId = formData.get('userId') as string;
    const taskId = formData.get('taskId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    if (!userId || !taskId) {
      return NextResponse.json(
        { error: 'User ID and Task ID are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'File must be a video' },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Video file size must be less than 50MB' },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'mp4';
    const fileName = `${userId}_${taskId}_${timestamp}.${fileExtension}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'videos');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file
    const filePath = join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // Return file metadata
    const fileUrl = `/uploads/videos/${fileName}`;
    
    return NextResponse.json({
      success: true,
      fileName,
      filePath: fileUrl,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
