import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';

/*
Purpose: API endpoint for user authentication in PaySkill app. Validates phone numbers
against approved list, saves/updates user in MongoDB with login times using native
MongoDB driver, and returns authentication status. Handles user creation and login time tracking.
*/

const APPROVED_LAST10 = ["1234567890", "9842470497", "9998887776"];

function normalizeToLast10(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits.length <= 10 ? digits : digits.slice(-10);
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizeToLast10(phone);

    if (!normalizedPhone || normalizedPhone.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit phone number' },
        { status: 400 }
      );
    }

    // Check if phone number is in approved list
    if (!APPROVED_LAST10.includes(normalizedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Phone number not authorized' },
        { status: 401 }
      );
    }

    // Find or create user and add login time using UserService
    const user = await UserService.findOrCreateAndAddLoginTime(normalizedPhone);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id?.toString(),
        phone: user.phone,
        loginCount: user.loginTimes.length,
        lastLogin: user.loginTimes[user.loginTimes.length - 1],
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
