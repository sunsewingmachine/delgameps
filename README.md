# PaySkill - Next.js Authentication App

PaySkill is a modern Next.js application with MongoDB-based user authentication, featuring phone number validation, user tracking, and login history management.

## Overview

This application provides a secure authentication system where users log in using their phone numbers. The system validates phone numbers against an approved list, stores user data in MongoDB, and tracks login history with timestamps.

## Key Features

- **Phone Number Authentication**: Users authenticate using 10-digit phone numbers
- **MongoDB Integration**: User data stored in MongoDB Atlas with login history tracking using native MongoDB driver
- **Approved User System**: Only pre-approved phone numbers can access the application
- **Login History**: Each login attempt is recorded with timestamp in user's record
- **Responsive Design**: Modern, responsive UI with dark mode support
- **Session Management**: Secure session handling with localStorage
- **TypeScript Support**: Full TypeScript implementation for type safety

## Architecture

### Authentication Flow
1. User enters phone number on login page (`/login`)
2. Phone number is validated and normalized to last 10 digits
3. API endpoint (`/api/auth/login`) checks against approved list
4. If approved, user is created/updated in MongoDB with new login time
5. User session is established and redirected to home page

### Database Schema
- **Collection**: `users`
- **Fields**:
  - `phone`: String (10 digits, unique, indexed)
  - `loginTimes`: Array of Date objects
  - `createdAt`: Date (auto-generated)
  - `updatedAt`: Date (auto-generated)

### File Structure
```
src/
├── app/
│   ├── api/auth/login/route.ts    # Authentication API endpoint
│   ├── api/test-db/route.ts       # Database testing endpoint
│   ├── api/test-connection/route.ts # Connection testing endpoint
│   ├── login/page.tsx             # Login page component
│   └── ...                       # Other pages
├── lib/
│   ├── mongodb.ts                 # MongoDB connection utility (native driver)
│   ├── userService.ts             # User database operations service
│   └── userUtils.ts               # User management utilities
└── components/
    └── ...                       # UI components
```

## Environment Setup

Required environment variables in `.env.local`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DBNAME=PaySkill
```

## Authentication Configuration

### Approved Phone Numbers
Currently configured approved phone numbers (last 10 digits):
- 1234567890
- 9842470497
- 9998887776

To modify approved numbers, update the `APPROVED_LAST10` array in:
- `src/app/api/auth/login/route.ts`

### User Data Storage
- Users are automatically created on first successful login
- Each login adds a new timestamp to the `loginTimes` array
- User data includes: ID, phone, login count, last login time, creation date

## API Endpoints

### POST /api/auth/login
Authenticates user and manages login history.

**Request Body:**
```json
{
  "phone": "1234567890"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "phone": "1234567890",
    "loginCount": 5,
    "lastLogin": "2025-01-09T10:12:30.000Z",
    "createdAt": "2025-01-01T08:00:00.000Z"
  }
}
```

### GET /api/test-db
Tests database connection and displays user statistics.

### GET /api/test-connection
Tests basic MongoDB connection without models.

## Database Operations

### UserService (`src/lib/userService.ts`)
The UserService class provides all database operations using native MongoDB driver:
- `findUserByPhone()`: Find user by phone number
- `createUser()`: Create new user with first login time
- `addLoginTime()`: Add new login time to existing user
- `findOrCreateAndAddLoginTime()`: Main authentication method
- `countUsers()`: Get total user count
- `getSampleUsers()`: Get sample user data for testing
- `createIndexes()`: Ensure database indexes are created

## Utility Functions

### User Management (`src/lib/userUtils.ts`)
- `getUserFromStorage()`: Retrieve user data from localStorage
- `isUserAuthenticated()`: Check authentication status
- `getUserPhone()`: Get user's phone number
- `clearUserSession()`: Clear user session data
- `formatLoginTime()`: Format timestamps for display

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Set Environment Variables:**
   Create `.env.local` with MongoDB credentials

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

4. **Access Application:**
   Open [http://localhost:3000](http://localhost:3000)

## Database Connection

The app uses MongoDB Atlas with native MongoDB driver featuring:
- Connection pooling and caching to prevent multiple connections during development
- Error handling and retry logic
- Environment variable validation
- Automatic index creation for optimal performance

## Security Features

- Phone number validation and normalization
- Approved user list validation
- MongoDB injection protection via parameterized queries
- Session data stored in localStorage (client-side only)
- Environment variable protection via .gitignore

## Development Notes

- Uses Next.js 15 with App Router
- TypeScript for type safety
- Native MongoDB driver (no ODM dependencies)
- Tailwind CSS for styling
- Client-side session management
- Modular service-based architecture

## Roadmap

- [ ] Add logout functionality
- [ ] Implement user profile management
- [ ] Add admin panel for managing approved users
- [ ] Implement JWT-based authentication
- [ ] Add email notifications for login attempts
- [ ] Create user dashboard with login history
