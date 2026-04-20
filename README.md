# Campus Bus Tracking System

Production-ready full-stack campus bus tracking system with role-based workflows for Students, Drivers, and Admins.

## Tech Stack

- Frontend: React (Vite, JavaScript), Tailwind CSS, Socket.IO client, OpenStreetMap (Leaflet)
- Backend: Node.js, Express, Mongoose, Socket.IO
- Database: MongoDB
- PWA: Manifest + service worker (installable, offline static asset caching)

## Project Structure

```text
frontend/   # React (JS) client app + PWA files
backend/    # Express (JS) API + Socket.IO + Mongoose
```

## Features

### Student
- Live map view of all buses
- Real-time bus movement updates over WebSocket
- ETA shown per bus
- Delay notifications

### Driver (mobile-first PWA)
- Login
- Start/stop trip
- Periodic GPS location emission (every ~3 seconds)
- Status updates (running, delayed, stopped)

### Admin
- Dashboard with live bus data
- CRUD routes and buses
- Assign driver to bus
- Monitor real-time movement

## Backend API

Base URL: `http://localhost:5000/api`

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /users` (admin)
- `GET /users/drivers` (admin)
- `GET /routes`
- `POST /routes` (admin)
- `PATCH /routes/:id` (admin)
- `DELETE /routes/:id` (admin)
- `GET /buses`
- `GET /buses/locations/latest`
- `GET /buses/eta?busId=<id>&lat=<value>&lng=<value>`
- `POST /buses` (admin)
- `PATCH /buses/:id` (admin)
- `DELETE /buses/:id` (admin)
- `POST /buses/assign-driver` (admin)

## Socket Events

- Driver -> Server: `locationUpdate`
  - payload: `{ driverId, busId, latitude, longitude, status }`
- Server -> Clients: `busLocationUpdated`
- Server -> Clients: `delayNotification`

Location updates are throttled server-side by `LOCATION_THROTTLE_MS`.

## MongoDB Collections (Schemas)

- `users` (includes student/driver/admin role)
- `buses`
- `routes`
- `locations` (time-series style log per bus and timestamp)

## Local Setup

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend defaults to `http://localhost:5173`, backend defaults to `http://localhost:5000`.

## Default Seed Accounts

- Admin: `admin@campus.local` / `admin123`
- Driver: `driver@campus.local` / `driver123`
- Student: `student@campus.local` / `student123`

## Environment Variables

### Backend (`backend/.env`)
- `PORT`
- `MONGO_URI`
- `DB_NAME`
- `JWT_SECRET`
- `CLIENT_ORIGIN`
- `LOCATION_THROTTLE_MS`
- `DEFAULT_SPEED_KMPH`

### Frontend (`frontend/.env`)
- `VITE_API_BASE_URL`
- `VITE_SOCKET_URL`

## Build

```bash
cd frontend
npm run build
```

## Notes

- The project is fully JavaScript (no TypeScript source files).
- For production deployment, set secure JWT secret, HTTPS origins, and proper MongoDB credentials.
