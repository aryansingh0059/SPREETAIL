"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const splitCalculator_1 = require("../utils/splitCalculator");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
// POST /api/expenses
router.post('/', async (req, res) => {
    try {
        const { groupId, paidById, amount, originalAmount, originalCurrencyCode, exchangeRateApplied, splitType, date, description, notes, isRefund, participants } = req.body;
        if (!groupId || !paidById || !amount || !splitType || !date || !participants || participants.length === 0) {
            return res.status(400).json({ error: 'Missing required expense fields' });
        }
        // Mathematically calculate what each participant owes
        // If it's a refund (Anomaly 9), the amount is negative. The math still works.
        const calculatedParticipants = (0, splitCalculator_1.calculateSplits)(Number(amount), splitType, participants);
        // Upsert currency if it is foreign (Anomaly 8 support)
        if (originalCurrencyCode) {
            await prisma_1.prisma.currency.upsert({
                where: { code: originalCurrencyCode },
                update: {},
                create: { code: originalCurrencyCode, symbol: originalCurrencyCode, name: originalCurrencyCode }
            });
        }
        // Wrap the entire expense and participants creation in a transaction
        const expense = await prisma_1.prisma.$transaction(async (tx) => {
            const newExpense = await tx.expense.create({
                data: {
                    groupId,
                    paidById,
                    amount,
                    originalAmount: originalAmount || amount,
                    originalCurrencyCode: originalCurrencyCode || 'INR', // Default fallback
                    exchangeRateApplied,
                    splitType: splitType,
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
    }
    catch (error) {
        console.error('Create expense error:', error);
        res.status(400).json({ error: error.message || 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=expenses.routes.js.map