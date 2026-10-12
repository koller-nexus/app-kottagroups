// Tipos espelhados de api-kottagroups/api/openapi.yaml.

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  pixKey?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  emailConfirmed: boolean;
}

export interface ApiGroupSummary {
  id: string;
  name: string;
  emoji: string;
  archived: boolean;
  ownerId: string;
  createdAt: string;
}

export type ApiMemberRole = "owner" | "admin" | "member";

export interface ApiGroupMember {
  id: string;
  name: string;
  role: ApiMemberRole;
}

export interface ApiBalance {
  userId: string;
  netCents: number;
}

export interface ApiGroupDetail extends ApiGroupSummary {
  members: ApiGroupMember[];
  balances: ApiBalance[];
}

export interface ApiExpense {
  id: string;
  groupId: string;
  description: string;
  amountCents: number;
  category: string;
  paidByUserId: string;
  createdByUserId: string;
  splitType: "equal" | "custom";
  customSplit?: Record<string, number> | null;
  createdAt: string;
}

export interface ApiExpenseDetail extends ApiExpense {
  shares: { userId: string; amountCents: number }[];
}

export interface ApiSettlement {
  id: string;
  from: string;
  to: string;
  amountCents: number;
  paid: boolean;
  createdAt?: string;
}

export interface ApiNotification {
  id: string;
  from: string;
  to: string;
  amountCents: number;
  paid: boolean;
  direction: "incoming" | "outgoing";
  group: { id: string; name: string };
  createdAt: string;
}

export interface ApiCategory {
  id: string;
  slug: string;
  label: string;
  emoji: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiShoppingProgress {
  totalItems: number;
  completedItems: number;
  completedPercent: number;
}

export interface ApiShoppingListSummary {
  id: string;
  name: string;
  createdAt: string;
  progress: ApiShoppingProgress;
}

export interface ApiShoppingItem {
  id: string;
  name: string;
  quantity: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiReceipt {
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  url?: string;
}

export interface ApiShoppingListDetail extends ApiShoppingListSummary {
  groupId: string;
  updatedAt: string;
  items: ApiShoppingItem[];
  receipt?: ApiReceipt | null;
}

export type ApiInvoiceStatus = "queued" | "processing" | "done" | "failed" | "needs_review";

export interface ApiInvoice {
  id: string;
  status: ApiInvoiceStatus;
  originalName: string;
  establishment: string;
  issuedOn: string | null;
  estimatedTotal: number;
  itemsTotal: number;
  items: unknown;
  documentType: string;
  needsReview: boolean;
  riskLabel: string;
  ocrConfidence: number;
  errorMessage?: string;
  processingMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor?: string | null;
  hasMore: boolean;
}

export interface ApiErrorBody {
  code: string;
  message: string;
}
