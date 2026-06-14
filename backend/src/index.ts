import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';

// Initialize the Prisma Client to interact with our Database Schema
import authRoutes from './routes/auth.routes';
import groupRoutes from './routes/groups.routes';
import expenseRoutes from './routes/expenses.routes';
import settlementRoutes from './routes/settlements.routes';
import balanceRoutes from './routes/balances.routes';
import importRoutes from './routes/imports.routes';

const app = express();

// Middleware to parse JSON bodies and allow Cross-Origin requests from the frontend
app.use(express.json());
app.use(cors());

// Mount the authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/groups', balanceRoutes); // This catches /api/groups/:id/balances
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/imports', importRoutes);

// A basic health check endpoint to ensure our server is up
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Shared Expenses API is running.' });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
