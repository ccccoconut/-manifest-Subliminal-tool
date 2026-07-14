export interface DayQuota {
  date: string;
  /** 已完成作品次数（删除不减少） */
  tracksUsed: number;
  /** 已完成作品的 id，防重复计次 */
  trackIds: string[];
  /** AI /api/generate 调用次数 */
  aiUsed: number;
}

export interface QuotaSnapshot {
  date: string;
  trackLimit: number;
  tracksUsed: number;
  tracksRemaining: number;
  aiLimit: number;
  aiUsed: number;
  aiRemaining: number;
  resetLabel: string;
  canCreate: boolean;
  canCallAi: boolean;
}

export type QuotaErrorCode = "QUOTA_TRACK" | "QUOTA_AI" | "INVALID_DEVICE";
