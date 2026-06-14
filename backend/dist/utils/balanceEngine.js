"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplifyDebts = exports.calculateNetBalances = void 0;
/**
 * Calculates net balances for all users based on expenses and settlements.
 */
const calculateNetBalances = (expenses, settlements) => {
    const balances = {};
    // Initialize or update user balance
    const addBalance = (userId, amount) => {
        if (!balances[userId])
            balances[userId] = 0;
        balances[userId] += amount;
    };
    // 1. Process Expenses
    for (const expense of expenses) {
        const amount = Number(expense.amount);
        // Normal expense vs Refund logic (Anomaly 9)
        const multiplier = expense.isRefund ? -1 : 1;
        // The payer gets credited (or debited if it's a refund)
        addBalance(expense.paidById, amount * multiplier);
        // The participants get debited (or credited if it's a refund)
        for (const p of expense.participants) {
            const owed = Number(p.calculatedOwedAmount);
            addBalance(p.userId, -owed * multiplier);
        }
    }
    // 2. Process Settlements
    for (const settlement of settlements) {
        const amount = Number(settlement.amount);
        // The person who paid the settlement gets credited
        addBalance(settlement.paidById, amount);
        // The person who received the settlement gets debited
        addBalance(settlement.paidToId, -amount);
    }
    // Round all balances to 2 decimal places to clean up float drift
    for (const userId in balances) {
        balances[userId] = Math.round(balances[userId] * 100) / 100;
    }
    return balances;
};
exports.calculateNetBalances = calculateNetBalances;
/**
 * Greedy algorithm to simplify debts.
 * Converts a map of net balances into a list of direct payment instructions.
 */
const simplifyDebts = (balances) => {
    const debtors = [];
    const creditors = [];
    for (const [userId, amount] of Object.entries(balances)) {
        if (amount < -0.01)
            debtors.push({ userId, amount: Math.abs(amount) });
        else if (amount > 0.01)
            creditors.push({ userId, amount });
    }
    // Sort descending by amount to minimize total transactions
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    const optimizations = [];
    let d = 0;
    let c = 0;
    while (d < debtors.length && c < creditors.length) {
        const debtor = debtors[d];
        const creditor = creditors[c];
        const settledAmount = Math.min(debtor.amount, creditor.amount);
        optimizations.push({
            fromUserId: debtor.userId,
            toUserId: creditor.userId,
            amount: Math.round(settledAmount * 100) / 100
        });
        debtor.amount -= settledAmount;
        creditor.amount -= settledAmount;
        if (Math.abs(debtor.amount) < 0.01)
            d++;
        if (Math.abs(creditor.amount) < 0.01)
            c++;
    }
    return optimizations;
};
exports.simplifyDebts = simplifyDebts;
//# sourceMappingURL=balanceEngine.js.map