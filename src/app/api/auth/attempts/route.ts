import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';

/*
Purpose: API endpoint to save login attempts to the 'attempts' collection in MongoDB.
Records timestamp, phone number, and referer code for each login attempt for tracking purposes.
*/

export async function POST(request: NextRequest) {
    try {
        const { phone, referer, result, reason } = await request.json();

        if (!phone || !referer) {
            return NextResponse.json(
                { success: false, error: 'Phone number and referer are required' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();
        
        // Create Indian time (IST) timestamp in format: 2025-09-11 05:13:59
        const now = new Date();
        const istTime = now.toLocaleString("en-CA", {
            timeZone: "Asia/Kolkata",
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(',', '');
        
        // Save attempt to attempts collection
        const attemptData = {
            phone: phone.trim(),
            referer: referer.trim(),
            result: result || 'pending', // 'success', 'failed', 'pending'
            reason: reason || null, // 'invalid_referer', 'unauthorized_phone', 'network_error', etc.
            timestamp: istTime
        };

        const attemptResult = await db.collection('attempts').insertOne(attemptData);

        return NextResponse.json({
            success: true,
            message: 'Attempt logged successfully',
            attemptId: attemptResult.insertedId
        });

    } catch (error) {
        console.error('Error saving login attempt:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save login attempt' },
            { status: 500 }
        );
    }
}
