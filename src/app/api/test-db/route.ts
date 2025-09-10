import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { UserService } from '@/lib/userService';

/*
Purpose: Test API endpoint for PaySkill app. Verifies MongoDB connection and user service
functionality using native MongoDB driver. Can be used to test database connectivity 
and user creation/retrieval operations during development.
*/

export async function GET() {
  try {
    // Test MongoDB connection
    const { client, db } = await connectToDatabase();
    
    // Get connection details
    const dbName = db.databaseName;
    
    // Test user count using UserService
    const userCount = await UserService.countUsers();
    
    // Get sample user data using UserService
    const sampleUsers = await UserService.getSampleUsers(3);

    // Get all collections in the database
    const collections = await db.listCollections().toArray();

    // Ensure indexes are created
    await UserService.createIndexes();

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      connectionDetails: {
        mongodbUri: process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'), // Hide credentials
        databaseName: dbName,
        collectionName: 'users',
        connectionState: 'connected', // If we reach here, connection is successful
        availableCollections: collections.map((c: any) => c.name)
      },
      data: {
        totalUsers: userCount,
        sampleUsers: sampleUsers.map(user => ({
          id: user._id?.toString(),
          phone: user.phone,
          loginCount: user.loginTimes.length,
          lastLogin: user.loginTimes[user.loginTimes.length - 1],
          createdAt: user.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        mongodbUri: process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')
      },
      { status: 500 }
    );
  }
}
