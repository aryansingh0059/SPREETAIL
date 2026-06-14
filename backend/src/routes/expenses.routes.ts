import { Router, Response } from 'express';
import { SplitType } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { calculateSplits, ParticipantInput } from '../utils/splitCalculator';
import { prisma } from '../lib/prisma';

const router = Router();

router.use(authenticateToken);

// POST /api/expenses
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { 
      groupId, paidById, amount, originalAmount, originalCurrencyCode, 
      exchangeRateApplied, splitType, date, description, notes, isRefund, 
      participants 
    } = req.body;

    if (!groupId || !paidById || !amount || !splitType || !date || !participants || participants.length === 0) {
      return res.status(400).json({ error: 'Missing required expense fields' });
    }

    // Mathematically calculate what each participant owes
    // If it's a refund (Anomaly 9), the amount is negative. The math still works.
    const calculatedParticipants = calculateSplits(Number(amount), splitType as SplitType, participants);

    // Upsert currency if it is foreign (Anomaly 8 support)
    if (originalCurrencyCode) {
      await prisma.currency.upsert({
        where: { code: originalCurrencyCode },
        update: {},
        create: { code: originalCurrencyCode, symbol: originalCurrencyCode, name: originalCurrencyCode }
      });
    }

    // Wrap the entire expense and participants creation in a transaction
    const expense = await prisma.$transaction(async (tx) => {
      const newExpense = await tx.expense.create({
        data: {
          groupId,
          paidById,
          amount,
          originalAmount: originalAmount || amount,
          originalCurrencyCode: originalCurrencyCode || 'INR', // Default fallback
          exchangeRateApplied,
          splitType: splitType as SplitType,
          date: new Date(date),
          description,
          notes,
          isRefund: !!isRefund,
          participants: {
            create: calculatedParticipants.map(p => ({
              userId: p.userId,
              splitValue: p.splitValue,
              calculatedOwedAmount: p.calculatedOwedAmount
            }))
          }
        },
        include: {
          participants: true
        }
      });

      return newExpense;
    });

    res.status(201).json(expense);
  } catch (error: any) {
    console.error('Create expense error:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
