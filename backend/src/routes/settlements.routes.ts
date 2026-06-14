import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

// POST /api/settlements
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, paidById, paidToId, amount, currencyCode, date } = req.body;

    if (!groupId || !paidById || !paidToId || !amount || !currencyCode || !date) {
      return res.status(400).json({ error: 'Missing required settlement fields' });
    }

    // Ensure currency exists
    await prisma.currency.upsert({
      where: { code: currencyCode },
      update: {},
      create: { code: currencyCode, symbol: currencyCode, name: currencyCode }
    });

    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        paidById,
        paidToId,
        amount,
        currencyCode,
        date: new Date(date)
      }
    });

    res.status(201).json(settlement);
  } catch (error) {
    console.error('Create settlement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
