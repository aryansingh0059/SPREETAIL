"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
// POST /api/settlements
router.post('/', async (req, res) => {
    try {
        const { groupId, paidById, paidToId, amount, currencyCode, date } = req.body;
        if (!groupId || !paidById || !paidToId || !amount || !currencyCode || !date) {
            return res.status(400).json({ error: 'Missing required settlement fields' });
        }
        // Ensure currency exists
        await prisma_1.prisma.currency.upsert({
            where: { code: currencyCode },
            update: {},
            create: { code: currencyCode, symbol: currencyCode, name: currencyCode }
        });
        const settlement = await prisma_1.prisma.settlement.create({
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
    }
    catch (error) {
        console.error('Create settlement error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=settlements.routes.js.map