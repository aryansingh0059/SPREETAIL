import { AnomalySeverity } from '@prisma/client';
export interface RawRow {
    id: string;
    data: any;
}
export interface GroupMember {
    userId: string;
    name: string;
    joinDate: Date;
    leaveDate: Date | null;
}
export interface DetectedAnomaly {
    importRowId: string;
    anomalyType: string;
    severity: AnomalySeverity;
    description: string;
}
export declare const runAnomalyEngine: (rawRows: RawRow[], activeMembers: GroupMember[], baseCurrency: string) => DetectedAnomaly[];
//# sourceMappingURL=anomalyDetector.d.ts.map