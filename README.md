# Spreetail Split

A modern, highly interactive web application designed to help groups manage shared budgets, parse CSV expense ledgers, detect anomalies, and automatically settle up complex debts.

## ✨ Features
- **Group Dashboards**: Create infinite groups, invite members, and track shared balances.
- **Smart Debt Settlement**: Automatically calculates exactly who owes who, minimizing the total number of transactions required to settle the group.
- **CSV Data Importer**: Upload raw expense CSVs. The backend anomaly engine parses it and intelligently flags anomalies (like incorrect dates, wrong members, or exact duplicates).
- **Interactive Review Logs**: An audit dashboard to review and manually resolve flagged anomalies.
- **Beautiful UI**: Modern aesthetics featuring a sleek Indigo color palette, smooth animations, and robust interactive modals.

## 🚀 Tech Stack
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Lucide React Icons, React Router.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL.
- **Auth**: JWT & bcrypt for secure authentication.

---

## 🛠️ Local Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running locally.

### 2. Clone the Repository
```bash
git clone https://github.com/aryansingh0059/SPREETAIL.git
cd SPREETAIL
```

### 3. Setup the Database
1. Create a local PostgreSQL database (e.g., named `spreetail`).
2. Create an `.env` file in the `backend/` directory by copying the example:
   ```bash
   cp .env.example backend/.env
   ```
3. Update the `DATABASE_URL` inside `backend/.env` to point to your local database.

### 4. Install & Run Backend
Open a terminal and run:
```bash
cd backend
npm install

# Run database migrations
npx prisma migrate dev --name init

# Generate the Prisma client
npx prisma generate

# Seed the database with demo data (optional but recommended!)
npx tsx seed_demo.ts

# Start the development server (runs on port 4000)
npm run dev
```

### 5. Install & Run Frontend
Open a new terminal and run:
```bash
cd frontend
npm install

# Start the Vite development server
npm run dev
```

Your app is now running at `http://localhost:5173`! 
*If you ran the seed script, you can click "Quick Demo Login" on the Auth page to log in as Aisha immediately.*

---

## 📦 Deployment Guide

### Backend Deployment (Render / Heroku)
1. Set the environment variables `DATABASE_URL` and `JWT_SECRET` in your hosting provider's dashboard.
2. Build Command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
3. Start Command: `npm start`

### Frontend Deployment (Vercel / Netlify)
1. Ensure your backend is deployed and you have the live API URL.
2. In `frontend/src/lib/api.ts`, update the `baseURL` to point to your production API.
3. Build Command: `npm run build`
4. Publish Directory: `dist`
