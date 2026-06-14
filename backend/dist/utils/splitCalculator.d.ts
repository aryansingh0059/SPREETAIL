import { SplitType } from '@prisma/client';
export interface ParticipantInput {
    userId: string;
    splitValue?: number;
}
export interface CalculatedParticipant {
    userId: string;
    splitValue: number | null;
    calculatedOwedAmount: number;
}
/**
 * Calculates the exact amount owed by each participant based on the split type.
 * Ensures the sum of calculated amounts exactly equals the totalAmount (handling rounding errors).
 */
export declare const calculateSplits: (totalAmount: number, splitType: SplitType, participants: ParticipantInput[]) => CalculatedParticipant[];
//# sourceMappingURL=splitCalculator.d.ts.map