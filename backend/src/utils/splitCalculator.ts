import { SplitType } from '@prisma/client';

export interface ParticipantInput {
  userId: string;
  splitValue?: number; // e.g. 30 (for 30%), 2 (for 2 shares), or exact amount if UNEQUAL
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
export const calculateSplits = (
  totalAmount: number,
  splitType: SplitType,
  participants: ParticipantInput[]
): CalculatedParticipant[] => {
  let calculated: CalculatedParticipant[] = [];
  const totalCents = Math.round(totalAmount * 100);

  if (splitType === 'EQUAL') {
    const splitCount = participants.length;
    const baseAmountCents = Math.floor(totalCents / splitCount);
    let remainderCents = totalCents - (baseAmountCents * splitCount);

    calculated = participants.map((p, index) => {
      // Distribute the remainder cents one by one to the first participants
      const extraCent = index < remainderCents ? 1 : 0;
      return {
        userId: p.userId,
        splitValue: null, // Equal doesn't use a specific value
        calculatedOwedAmount: (baseAmountCents + extraCent) / 100
      };
    });
  } 
  else if (splitType === 'PERCENTAGE') {
    const totalPercentage = participants.reduce((sum, p) => sum + (p.splitValue || 0), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(`Percentages must sum to exactly 100%. Got ${totalPercentage}%`);
    }

    let allocatedCents = 0;
    calculated = participants.map((p) => {
      const shareCents = Math.round(totalCents * ((p.splitValue || 0) / 100));
      allocatedCents += shareCents;
      return {
        userId: p.userId,
        splitValue: p.splitValue || 0,
        calculatedOwedAmount: shareCents / 100
      };
    });

    // Fix rounding discrepancies by adding/subtracting from the first participant
    const diff = totalCents - allocatedCents;
    if (diff !== 0 && calculated.length > 0) {
      calculated[0].calculatedOwedAmount = (Math.round(calculated[0].calculatedOwedAmount * 100) + diff) / 100;
    }
  }
  else if (splitType === 'SHARE') {
    const totalShares = participants.reduce((sum, p) => sum + (p.splitValue || 0), 0);
    if (totalShares <= 0) throw new Error('Total shares must be > 0');

    let allocatedCents = 0;
    calculated = participants.map((p) => {
      const shareFraction = (p.splitValue || 0) / totalShares;
      const shareCents = Math.floor(totalCents * shareFraction);
      allocatedCents += shareCents;
      return {
        userId: p.userId,
        splitValue: p.splitValue || 0,
        calculatedOwedAmount: shareCents / 100
      };
    });

    // Distribute remainder cents due to Math.floor
    let remainderCents = totalCents - allocatedCents;
    let index = 0;
    while (remainderCents > 0) {
      calculated[index].calculatedOwedAmount = (Math.round(calculated[index].calculatedOwedAmount * 100) + 1) / 100;
      remainderCents--;
      index = (index + 1) % calculated.length;
    }
  }
  else if (splitType === 'UNEQUAL') {
    let allocatedCents = 0;
    calculated = participants.map((p) => {
      const amountCents = Math.round((p.splitValue || 0) * 100);
      allocatedCents += amountCents;
      return {
        userId: p.userId,
        splitValue: p.splitValue || 0, // In unequal, splitValue IS the raw amount
        calculatedOwedAmount: amountCents / 100
      };
    });

    if (allocatedCents !== totalCents) {
      throw new Error(`Unequal amounts sum (${allocatedCents / 100}) does not match total amount (${totalAmount})`);
    }
  }

  return calculated;
};
