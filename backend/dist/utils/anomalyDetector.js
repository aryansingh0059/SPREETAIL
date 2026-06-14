"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAnomalyEngine = void 0;
const runAnomalyEngine = (rawRows, activeMembers, baseCurrency) => {
    const anomalies = [];
    const validMemberNames = activeMembers.map(m => m.name.toLowerCase());
    // To detect duplicates/contradictions across the batch
    const rowSignatures = {};
    for (const row of rawRows) {
        const d = row.data;
        // A5: Missing Payer
        if (!d.paid_by || d.paid_by.trim() === '') {
            anomalies.push({
                importRowId: row.id,
                anomalyType: 'MISSING_PAYER',
                severity: 'BLOCKING',
                description: 'Missing "Paid By" (Payer).'
            });
        }
        // A3 & A4: Name Casing/Whitespace & Ambiguous Payer
        const allNamesInRow = [
            d.paid_by,
            ...(d.split_with ? d.split_with.split(';') : [])
        ].map((n) => n ? n : '').filter(n => n.length > 0);
        for (const name of allNamesInRow) {
            if (!validMemberNames.includes(name.trim().toLowerCase())) {
                anomalies.push({
                    importRowId: row.id,
                    anomalyType: 'UNKNOWN_PARTICIPANT',
                    severity: 'BLOCKING',
                    description: `Unknown Participant: '${name}'`
                });
            }
        }
        // A2: Amount Comma Format
        if (d.amount && typeof d.amount === 'string' && d.amount.includes(',')) {
            anomalies.push({
                importRowId: row.id,
                anomalyType: 'AMOUNT_COMMA_FORMAT',
                severity: 'BLOCKING',
                description: `Amount "${d.amount}" contains invalid comma formatting.`
            });
        }
        // A9: Negative Amount
        const parsedAmount = parseFloat(d.amount ? String(d.amount).replace(/,/g, '') : '0');
        if (parsedAmount < 0) {
            anomalies.push({
                importRowId: row.id,
                anomalyType: 'NEGATIVE_AMOUNT',
                severity: 'BLOCKING',
                description: 'Negative Amount Detected. Confirm if refund.'
            });
        }
        // A12: Zero Amount
        if (parsedAmount === 0 && d.amount !== undefined) {
            anomalies.push({
                importRowId: row.id,
                anomalyType: 'ZERO_AMOUNT',
                severity: 'WARNING',
                description: 'Zero Amount Expense Detected.'
            });
        }
        // A11: Missing Currency
        if (!d.currency || d.currency.trim() === '') {
            anomalies.push({
                importRowId: row.id,
                anomalyType: 'MISSING_CURRENCY',
                severity: 'BLOCKING',
                description: 'Missing Currency.'
            });
        }
        // A8: Foreign Currency
        if (d.currency && d.currency.trim().toUpperCase() !== baseCurrency.toUpperCase()) {
            anomalies.push({
                importRowId: row.id,
                anomalyType: 'FOREIGN_CURRENCY',
                severity: 'BLOCKING',
                description: `Foreign Currency Detected: ${d.currency}. Conversion required.`
            });
        }
        // A6: Settlement Logged as Expense
        if ((!d.split_type || d.split_type.trim() === '') && d.split_with && !d.split_with.includes(';')) {
            anomalies.push({
                importRowId: row.id,
                anomalyType: 'POTENTIAL_SETTLEMENT',
                severity: 'WARNING',
                description: 'Missing Split Type / Potential Settlement.'
            });
        }
        // A7: Percentages sum to 110%
        if (d.split_type === 'percentage' && d.split_details) {
            const parts = d.split_details.split(';');
            let sum = 0;
            parts.forEach((part) => {
                const match = part.match(/\d+(\.\d+)?/);
                if (match)
                    sum += parseFloat(match[0]);
            });
            if (Math.abs(sum - 100) > 0.01) {
                anomalies.push({
                    importRowId: row.id,
                    anomalyType: 'INVALID_PERCENTAGE',
                    severity: 'BLOCKING',
                    description: `Invalid Split: Percentages sum to ${sum}%`
                });
            }
        }
        // A14: Conflicting Split Type vs Details
        if (d.split_type === 'equal' && d.split_details && d.split_details.trim() !== '') {
            anomalies.push({
                importRowId: row.id,
                anomalyType: 'CONFLICTING_SPLIT',
                severity: 'BLOCKING',
                description: 'Conflicting Split Definition (Type equal but details provided).'
            });
        }
        // A10 & A16: Invalid Date / Ambiguous Date
        if (d.date) {
            // Basic DD-MM-YYYY check
            const dateParts = d.date.split('-');
            if (dateParts.length !== 3) {
                anomalies.push({
                    importRowId: row.id,
                    anomalyType: 'INVALID_DATE',
                    severity: 'BLOCKING',
                    description: `Invalid Date Format: '${d.date}'`
                });
            }
            else {
                const p1 = parseInt(dateParts[0], 10);
                const p2 = parseInt(dateParts[1], 10);
                if (p1 <= 12 && p2 <= 12) {
                    anomalies.push({
                        importRowId: row.id,
                        anomalyType: 'AMBIGUOUS_DATE',
                        severity: 'WARNING',
                        description: `Ambiguous Date Detected (DD-MM vs MM-DD): '${d.date}'`
                    });
                }
            }
        }
        // A13: Inactive Member Check (Mock logic - assume active logic runs in resolver or if dates are cleanly parsed)
        // For this engine we assume we cross check parsed date against membership
        // Note: If date is invalid, we skip this check until date is resolved.
        // A1 & A15: Duplicates & Contradictions Signature
        if (d.date && d.paid_by && d.amount) {
            const sig = `${d.date}|${d.amount}|${d.paid_by.trim().toLowerCase()}`;
            if (!rowSignatures[sig])
                rowSignatures[sig] = [];
            rowSignatures[sig].push(row.id);
        }
    }
    // Evaluate signatures for A1 & A15
    for (const sig in rowSignatures) {
        if (rowSignatures[sig].length > 1) {
            rowSignatures[sig].forEach(rowId => {
                anomalies.push({
                    importRowId: rowId,
                    anomalyType: 'DUPLICATE_OR_CONTRADICTORY',
                    severity: 'WARNING',
                    description: 'Contradictory / Near-Duplicate Records Detected.'
                });
            });
        }
    }
    return anomalies;
};
exports.runAnomalyEngine = runAnomalyEngine;
//# sourceMappingURL=anomalyDetector.js.map