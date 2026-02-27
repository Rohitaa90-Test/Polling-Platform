# Live Polling System

A real-time polling application built for the Intervue.io SDE Intern assignment. Teachers can create polls and students can answer them in real-time with synchronized timers.

## Live Demo

**Live Application:** https://polling-platform-phi.vercel.app/

## What's Inside

This project handles the tricky parts of real-time polling - like what happens when someone refreshes mid-poll or joins late. Everything stays in sync because the server keeps track of the actual state.

### For Teachers
- Create polls with custom questions and options
- Set timer duration (5 seconds to 1 hour)
- Watch votes come in live with percentage breakdowns
- View history of all past polls from the database
- Kick students if needed
- Chat with students during polls

### For Students
- Enter your name when you first join
- Get questions instantly when teacher asks them
- Timer syncs with the server (join late? your timer adjusts automatically)
- Vote once per question (can't spam or vote twice)
- See live results after voting
- Chat with teacher and other students

## The Resilience Part

This was the main challenge - making sure the app doesn't break when people refresh or lose connection:

- **Teacher refreshes during poll?** Poll is still there, timer keeps running
- **Student joins 30 seconds late to a 60-second poll?** Their timer shows 30 seconds, not 60
- **Someone tries to vote twice?** Database blocks it, UI shows an error
- **Connection drops briefly?** Socket.io reconnects automatically and restores state

The backend is the source of truth for everything - timers, vote counts, poll status. The frontend just displays what the server tells it.

## Tech Stack

**Frontend**
- React 19 with TypeScript
- Context API for state management
- Socket.io client for real-time updates
- React Router for navigation
- Tailwind CSS for styling

**Backend**
- Node.js + Express
- Socket.io for WebSocket connections
- PostgreSQL with Prisma ORM
- TypeScript throughout

## Architecture

I followed the Controller-Service pattern to keep things organized:

```
Backend:
├── controllers/     # Handle HTTP requests
├── services/        # Business logic and database operations
├── socket/          # Socket.io event handlers (no logic here)
├── routes/          # API endpoints
└── types/           # Shared TypeScript types

Frontend:
├── components/      # UI components
├── context/         # Global state (PollContext)
├── hooks/           # Custom hooks (useSocket, usePollTimer)
├── pages/           # Main views (Teacher, Student, Landing)
└── types/           # TypeScript interfaces
```

The socket handlers don't have business logic - they just pass data to services. This makes testing easier and keeps concerns separated.

## Key Features

### State Recovery
When you refresh the page, the app fetches current state from `/api/polls/current` and puts you right back where you were. Students see if they already voted, teachers see the active poll with correct remaining time.

### Timer Synchronization
The server calculates elapsed time and sends `remainingTime` to clients. Late joiners get the correct time remaining, not the original duration.

### Race Condition Prevention
Database has a unique constraint on `(pollId, studentId)`. If someone tries to vote twice (even by spamming the API), Prisma throws an error and the UI reverts the optimistic update.

### Optimistic UI
When students vote, the UI updates immediately. If the server rejects it (duplicate vote, poll ended, etc.), the UI rolls back and shows an error toast.

## Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your backend URL
npm run dev
```

The frontend runs on `http://localhost:5173` and backend on `http://localhost:5000` by default.

## Database Schema

Two main tables:
- **polls** - Stores questions, options, duration, start time, status
- **votes** - Stores student votes with unique constraint on (pollId, studentId)

Prisma handles the connection pooling and query building.

## Deployment Notes

**Frontend:** Deployed on Vercel with SPA routing configured  
**Backend:** Deployed on Render with keep-alive ping to prevent sleeping

The backend pings itself every 14 minutes in production to stay awake on Render's free tier.

## What I Learned

- How to handle state recovery in real-time apps
- Preventing race conditions with database constraints
- Synchronizing timers across multiple clients
- Proper separation of concerns in backend architecture
- Optimistic UI updates with error rollback

## Assignment Checklist

✅ Teacher can create polls with configurable duration  
✅ Students receive questions in real-time  
✅ Timer synchronization for late joiners  
✅ State recovery on page refresh  
✅ No duplicate votes (race condition handled)  
✅ Controller-Service pattern in backend  
✅ Custom hooks in frontend  
✅ Optimistic UI updates  
✅ Database persistence (PostgreSQL)  
✅ Poll history from database  
✅ Teacher can kick students  
✅ Chat between teacher and students  
✅ Hosted frontend and backend  
✅ TypeScript throughout  
✅ Follows Figma design

---

Built for Intervue.io SDE Intern Assignment
