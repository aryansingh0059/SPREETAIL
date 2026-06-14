import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Protect all group routes
router.use(authenticateToken);

// GET /api/groups - List all groups for the authenticated user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const groups = await prisma.groupMembership.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            memberships: {
              include: { user: true }
            }
          }
        }
      }
    });

    // Format the response
    const formattedGroups = groups.map(m => {
      // Find who created it (demo assumes the first member or we check the createdBy logic if we had one)
      // Since we don't have createdBy in Group model directly, we just return the group
      return {
        ...m.group,
        role: m.group.name === 'Apartment 4B' ? 'ADMIN' : 'MEMBER' // Demo logic
      };
    });

    res.status(200).json(formattedGroups);
  } catch (error) {
    console.error('Fetch groups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/groups - Create a new group
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, baseCurrencyCode } = req.body;
    const userId = req.user!.userId;

    if (!name || !baseCurrencyCode) {
      return res.status(400).json({ error: 'Group name and baseCurrencyCode are required' });
    }

    // Wrap in a transaction: create group, create base currency if missing, and add creator as member
    const result = await prisma.$transaction(async (tx) => {
      // Upsert currency just in case it doesn't exist
      await tx.currency.upsert({
        where: { code: baseCurrencyCode },
        update: {},
        create: { code: baseCurrencyCode, symbol: baseCurrencyCode, name: baseCurrencyCode }
      });

      const group = await tx.group.create({
        data: {
          name,
          baseCurrencyCode,
        }
      });

      // Automatically add the creator to the group
      await tx.groupMembership.create({
        data: {
          groupId: group.id,
          userId: userId,
          joinDate: new Date(), // They join immediately
          leaveDate: null
        }
      });

      return group;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/groups/:id/members - List members
router.get('/:id/members', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const memberships = await prisma.groupMembership.findMany({
      where: { groupId: id },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(200).json(memberships);
  } catch (error) {
    console.error('Fetch members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/groups/:id/members - Add or update a member's timeline
router.post('/:id/members', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, joinDate, leaveDate, role } = req.body;

    if (!email || !joinDate) {
      return res.status(400).json({ error: 'email and joinDate are required' });
    }

    // Lookup user by email
    let user = await prisma.user.findUnique({ where: { email } });
    
    // If they don't exist, create a dummy account for them so they can be added to the group
    if (!user) {
      const name = email.split('@')[0];
      const bcrypt = require('bcrypt');
      const dummyHash = await bcrypt.hash('dummy', 10);
      user = await prisma.user.create({
        data: {
          email,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          passwordHash: dummyHash
        }
      });
    }

    // Check if membership already exists to allow updating timelines
    const existingMembership = await prisma.groupMembership.findFirst({
      where: { groupId: id, userId: user.id }
    });

    let membership;
    if (existingMembership) {
      membership = await prisma.groupMembership.update({
        where: { id: existingMembership.id },
        data: {
          joinDate: new Date(joinDate),
          leaveDate: leaveDate ? new Date(leaveDate) : null
        }
      });
    } else {
      membership = await prisma.groupMembership.create({
        data: {
          groupId: id,
          userId: user.id,
          joinDate: new Date(joinDate),
          leaveDate: leaveDate ? new Date(leaveDate) : null
        }
      });
    }

    res.status(200).json(membership);
  } catch (error) {
    console.error('Update membership error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/groups/:id/expenses - List expenses and settlements
router.get('/:id/expenses', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const expenses = await prisma.expense.findMany({
      where: { groupId: id },
      include: {
        paidBy: { select: { id: true, name: true, email: true } },
        participants: { include: { user: { select: { id: true, name: true } } } }
      },
      orderBy: { date: 'desc' }
    });

    const settlements = await prisma.settlement.findMany({
      where: { groupId: id },
      include: {
        paidBy: { select: { id: true, name: true, email: true } },
        paidTo: { select: { id: true, name: true, email: true } }
      },
      orderBy: { date: 'desc' }
    });

    // Combine and sort them by date descending
    const combined = [
      ...expenses.map(e => ({ ...e, type: 'EXPENSE' })),
      ...settlements.map(s => ({ ...s, type: 'SETTLEMENT' }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    res.status(200).json(combined);
  } catch (error) {
    console.error('Fetch expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/groups/:id - Delete a group
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      // 1. Delete Anomalies and ImportRows related to the group's ImportJobs
      const importJobs = await tx.importJob.findMany({ where: { groupId: id }, select: { id: true } });
      const jobIds = importJobs.map(j => j.id);
      
      if (jobIds.length > 0) {
        const rows = await tx.importRow.findMany({ where: { importJobId: { in: jobIds } }, select: { id: true } });
        const rowIds = rows.map(r => r.id);
        if (rowIds.length > 0) {
          await tx.anomaly.deleteMany({ where: { importRowId: { in: rowIds } } });
        }
        await tx.importRow.deleteMany({ where: { importJobId: { in: jobIds } } });
      }
      await tx.importJob.deleteMany({ where: { groupId: id } });

      // 2. Delete ExpenseParticipants related to the group's Expenses
      const expenses = await tx.expense.findMany({ where: { groupId: id }, select: { id: true } });
      const expenseIds = expenses.map(e => e.id);
      if (expenseIds.length > 0) {
        await tx.expenseParticipant.deleteMany({ where: { expenseId: { in: expenseIds } } });
      }
      await tx.expense.deleteMany({ where: { groupId: id } });

      // 3. Delete Settlements
      await tx.settlement.deleteMany({ where: { groupId: id } });

      // 4. Delete UserAliases
      await tx.userAlias.deleteMany({ where: { groupId: id } });

      // 5. Delete GroupMemberships
      await tx.groupMembership.deleteMany({ where: { groupId: id } });

      // 6. Delete the Group
      await tx.group.delete({ where: { id } });
    });

    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
