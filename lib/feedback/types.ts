export type FeedbackEntry = {
  id: string;
  text: string;
  deviceId: string | null;
  createdAt: number;
  reply?: string;
  repliedAt?: number;
};

export type FeedbackStore = { items: FeedbackEntry[] };

export type FeedbackPublic = Pick<
  FeedbackEntry,
  "id" | "text" | "createdAt" | "reply" | "repliedAt"
>;
