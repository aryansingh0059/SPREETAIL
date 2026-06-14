interface NetBalance {
    [userId: string]: number;
}
export interface DebtOptimization {
    fromUserId: string;
    toUserId: string;
    amount: number;
}
/**
 * Calculates net balances for all users based on expenses and settlements.
 */
export declare const calculateNetBalances: (expenses: any[], settlements: any[]) => NetBalance;
/**
 * Greedy algorithm to simplify debts.
 * Converts a map of net balances into a list of direct payment instructions.
 */
export declare const simplifyDebts: (balances: NetBalance) => DebtOptimization[];
export {};
//# sourceMappingURL=balanceEngine.d.ts.map