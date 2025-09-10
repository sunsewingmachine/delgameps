import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

/*
Purpose: Simple connection test for PaySkill app. Tests MongoDB connection using native
MongoDB driver without using any models to isolate connection issues.
*/

export async function GET() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI!;
    const MONGODB_DBNAME = process.env.MONGODB_DBNAME!;
    
    console.log('Testing connection with URI:', MONGODB_URI);
    
    // Test direct connection using native MongoDB driver
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(MONGODB_DBNAME);
    const dbName = db.databaseName;
    const collections = await db.listCollections().toArray();
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      message: 'Direct connection successful',
      details: {
        originalUri: MONGODB_URI,
        dbName: MONGODB_DBNAME,
        connectedToDatabase: dbName,
        availableCollections: collections.map((c: any) => c.name)
      }
    });

  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        originalUri: process.env.MONGODB_URI,
        dbName: process.env.MONGODB_DBNAME
      },
      { status: 500 }
    );
  }
}
