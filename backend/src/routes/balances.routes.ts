import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { calculateNetBalances, simplifyDebts } from '../utils/balanceEngine';
import { prisma } from '../lib/prisma';

const router = Router();

router.use(authenticateToken);

// GET /api/groups/:id/balances
router.get('/:id/balances', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch all group expenses with their exact participant calculations
    const expenses = await prisma.expense.findMany({
      where: { groupId: id },
      include: {
        participants: true
      }
    });

    // Fetch all recorded 1-on-1 settlements for the group
    const settlements = await prisma.settlement.findMany({
      where: { groupId: id }
    });

    // Core logic execution
    const netBalances = calculateNetBalances(expenses, settlements);
    const simplifiedDebts = simplifyDebts(netBalances);

    res.status(200).json({
      netBalances,
      simplifiedDebts
    });
  } catch (error) {
    console.error('Fetch balances error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
