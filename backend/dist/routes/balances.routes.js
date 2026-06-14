"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const balanceEngine_1 = require("../utils/balanceEngine");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
// GET /api/groups/:id/balances
router.get('/:id/balances', async (req, res) => {
    try {
        const id = req.params.id;
        // Fetch all group expenses with their exact participant calculations
        const expenses = await prisma_1.prisma.expense.findMany({
            where: { groupId: id },
            include: {
                participants: true
            }
        });
        // Fetch all recorded 1-on-1 settlements for the group
        const settlements = await prisma_1.prisma.settlement.findMany({
            where: { groupId: id }
        });
        // Core logic execution
        const netBalances = (0, balanceEngine_1.calculateNetBalances)(expenses, settlements);
        const simplifiedDebts = (0, balanceEngine_1.simplifyDebts)(netBalances);
        res.status(200).json({
            netBalances,
            simplifiedDebts
        });
    }
    catch (error) {
        console.error('Fetch balances error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=balances.routes.js.map