# PaySkill - Skill-Based Task Management Platform

PaySkill is a modern Next.js application that combines user authentication with skill-based task management. Users can complete real-world challenges, upload proof videos, and get evaluated by experts to build their skill portfolio.

## Overview

This application provides a comprehensive skill development platform where users authenticate using phone numbers, browse available tasks, complete real-world challenges, and upload video proof for evaluation. The system tracks user progress and maintains task completion records.

## Key Features

### Authentication System
- **Phone Number Authentication**: Users authenticate using 10-digit phone numbers
- **MongoDB Integration**: User data stored in MongoDB Atlas with login history tracking
- **Approved User System**: Only pre-approved phone numbers can access the application
- **Session Management**: Secure session handling with localStorage

### Task Management System
- **10 Skill-Based Tasks**: Diverse challenges across multiple categories
- **Video Upload System**: Users upload proof videos for task completion
- **Task Progress Tracking**: Real-time progress monitoring and completion status
- **Evaluation System**: Tasks marked as "under evaluation" after video upload
- **Category-Based Organization**: Tasks organized by skill categories and difficulty levels

### User Interface
- **Elegant Home Page**: Modern card-based design with task grid layout
- **Task Detail Pages**: Comprehensive task information with upload functionality
- **Progress Dashboard**: Visual progress tracking with statistics
- **Responsive Design**: Mobile-friendly design with dark mode support
- **Navigation System**: Seamless navigation between home and task pages

## Architecture

### Authentication Flow
1. User enters phone number on login page (`/login`)
2. Phone number is validated and normalized to last 10 digits
3. API endpoint (`/api/auth/login`) checks against approved list
4. If approved, user is created/updated in MongoDB with new login time
5. User session is established and redirected to home page

### Task Completion Flow
1. User browses tasks on elegant home page (`/home`)
2. Clicks on task card to navigate to task detail page (`/task/[taskId]`)
3. Views task information, requirements, and difficulty level
4. Records video proof of task completion
5. Uploads video through secure upload system
6. Task marked as "under evaluation" in database
7. User can return to home page to view updated progress

### Database Schema

#### Users Collection
- **Fields**:
  - `phone`: String (10 digits, unique, indexed)
  - `loginTimes`: Array of Date objects
  - `createdAt`: Date (auto-generated)
  - `updatedAt`: Date (auto-generated)

#### Task Completions Collection
- **Fields**:
  - `userId`: String (phone number)
  - `taskId`: String (unique task identifier)
  - `taskTitle`: String (task name)
  - `videoFileName`: String (uploaded video filename)
  - `videoPath`: String (path to uploaded video)
  - `status`: String ('under_evaluation', 'approved', 'rejected')
  - `uploadedAt`: Date (upload timestamp)
  - `evaluatedAt`: Date (evaluation timestamp)
  - `feedback`: String (evaluator feedback)
  - `createdAt`: Date (auto-generated)
  - `updatedAt`: Date (auto-generated)

### Available Tasks

The platform includes 10 diverse skill-based tasks:

1. **Cook a Basic Meal** (Life Skills - Beginner)
2. **Public Speaking** (Communication - Intermediate)
3. **Write Basic Code** (Technical - Beginner)
4. **Create a Budget Plan** (Finance - Intermediate)
5. **Create Artwork** (Creative - Beginner)
6. **Complete Workout** (Health - Beginner)
7. **Language Practice** (Education - Intermediate)
8. **Solve a Puzzle** (Mental - Intermediate)
9. **Musical Performance** (Creative - Intermediate)
10. **Leadership Challenge** (Leadership - Advanced)

### File Structure
```
src/
├── app/
│   ├── api/
│   │   ├── auth/login/route.ts           # Authentication API
│   │   ├── tasks/completions/route.ts    # Task completion API
│   │   ├── upload/video/route.ts         # Video upload API
│   │   ├── test-db/route.ts              # Database testing
│   │   └── test-connection/route.ts      # Connection testing
│   ├── home/page.tsx                     # Elegant home page with task grid
│   ├── task/[taskId]/page.tsx           # Dynamic task detail pages
│   ├── login/page.tsx                    # Login page
│   └── ...                              # Other pages
├── lib/
│   ├── mongodb.ts                        # MongoDB connection utility
│   ├── userService.ts                    # User database operations
│   ├── taskService.ts                    # Task management service
│   └── userUtils.ts                      # User management utilities
├── components/
│   └── ...                              # Reusable UI components
└── public/
    └── uploads/videos/                   # Video upload directory (gitignored)
```

## Environment Setup

Required environment variables in `.env.local`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DBNAME=PaySkill
```

## API Endpoints

### Authentication
- **POST /api/auth/login**: User authentication and login history management

### Task Management
- **GET /api/tasks/completions**: Retrieve user task completions
- **POST /api/tasks/completions**: Create new task completion record

### File Upload
- **POST /api/upload/video**: Handle video file uploads with validation

### Testing
- **GET /api/test-db**: Database connection and statistics testing
- **GET /api/test-connection**: Basic MongoDB connection testing

## Task System Features

### Task Categories
- **Life Skills**: Practical everyday abilities
- **Communication**: Speaking and presentation skills
- **Technical**: Programming and technical skills
- **Finance**: Money management and budgeting
- **Creative**: Artistic and creative expression
- **Health**: Physical fitness and wellness
- **Education**: Learning and language skills
- **Mental**: Problem-solving and cognitive skills
- **Leadership**: Team management and leadership

### Difficulty Levels
- **Beginner**: Entry-level tasks for skill building
- **Intermediate**: Moderate challenges requiring some experience
- **Advanced**: Complex tasks for experienced individuals

### Video Upload System
- **File Validation**: Supports MP4, MOV, AVI, WebM formats
- **Size Limits**: Maximum 50MB per video file
- **Secure Storage**: Files stored in protected uploads directory
- **Metadata Tracking**: Complete upload and completion tracking

## User Experience Features

### Home Page
- **Task Grid Layout**: Responsive card-based design
- **Progress Statistics**: Visual progress tracking dashboard
- **Completion Status**: Clear indicators for completed tasks
- **Category Filtering**: Color-coded task categories
- **Difficulty Indicators**: Visual difficulty level badges

### Task Detail Pages
- **Comprehensive Information**: Full task descriptions and requirements
- **Time Estimates**: Expected completion time for each task
- **Upload Interface**: Drag-and-drop video upload functionality
- **Status Tracking**: Real-time upload and evaluation status
- **Navigation**: Easy back-to-home navigation

### Progress Tracking
- **Completion Percentage**: Overall progress calculation
- **Task Status**: Individual task completion tracking
- **Upload History**: Complete record of submitted videos
- **Evaluation Status**: Current evaluation state for each task

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

5. **Login with Approved Phone:**
   Use one of the approved phone numbers to access the platform

6. **Explore Tasks:**
   Browse the elegant home page and click on tasks to view details

7. **Upload Videos:**
   Complete tasks in real life and upload proof videos

## Security Features

- **Phone Number Validation**: Strict 10-digit phone number validation
- **File Upload Security**: Video file type and size validation
- **Path Security**: Secure file storage with proper directory structure
- **Database Security**: MongoDB injection protection via parameterized queries
- **Session Management**: Secure client-side session handling

## Development Notes

- **Next.js 15**: Latest Next.js with App Router architecture
- **TypeScript**: Full TypeScript implementation for type safety
- **Native MongoDB**: Direct MongoDB driver without ODM dependencies
- **Tailwind CSS**: Modern utility-first CSS framework
- **File Upload**: Multipart form data handling for video uploads
- **Responsive Design**: Mobile-first responsive design approach

## Roadmap

### Completed Features
- [x] Elegant home page with 10 task items
- [x] Task detail pages with video upload functionality
- [x] Database schema for task tracking
- [x] Video upload and storage logic
- [x] Navigation and back button functionality
- [x] Elegant component styling
- [x] User authentication system
- [x] Progress tracking dashboard

### Future Enhancements
- [ ] Admin panel for task evaluation
- [ ] Email notifications for task status updates
- [ ] Advanced video player for uploaded content
- [ ] Task difficulty progression system
- [ ] Social features and leaderboards
- [ ] Mobile app development
- [ ] Integration with external skill verification services
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Gamification features with badges and rewards

## Contributing

This application is designed for AI agents and developers to understand and extend. The modular architecture makes it easy to add new features, tasks, and functionality while maintaining code quality and type safety.
