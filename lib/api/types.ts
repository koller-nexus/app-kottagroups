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
  invoiceId: string | null;
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
  /** Correspondência viva com a nota; null sem nota ou depois de rejeitada. */
  match: ApiItemMatch | null;
  createdAt: string;
  updatedAt: string;
}

export type ApiExtractionMethod = "ocr" | "qrcode";
export type ApiMatchStatus = "matched" | "needs_review" | "confirmed" | "rejected";

export interface ApiItemMatch {
  id: string;
  status: Exclude<ApiMatchStatus, "rejected">;
  confidence: number;
}

export interface ApiReceiptFile {
  contentType: string;
  sizeBytes: number;
  url?: string;
}

/** Nota como vem embutida na lista. Os três primeiros campos são null em nota antiga ou PDF. */
export interface ApiReceiptSummary {
  invoiceId: string | null;
  status: ApiInvoiceStatus | null;
  extractionMethod: ApiExtractionMethod | null;
  /** null no caminho por QR code. */
  file: ApiReceiptFile | null;
  uploadedAt: string;
}

export interface ApiReceiptItem {
  index: number;
  description: string;
  quantity: number;
  unitCents: number;
  totalCents: number;
}

export interface ApiReceiptMatch {
  id: string;
  shoppingItemId: string;
  status: ApiMatchStatus;
  confidence: number;
  invoiceItem: ApiReceiptItem | null;
}

/** GET /shopping-lists/{id}/receipt. items e matches ficam vazios enquanto a nota é lida. */
export interface ApiShoppingReceipt extends ApiReceiptSummary {
  establishment: { cnpj: string | null; name: string; uf: string | null } | null;
  issuedOn: string | null;
  totalCents: number;
  items: ApiReceiptItem[];
  matches: ApiReceiptMatch[];
  errorMessage: string | null;
}

/** 202 do POST /shopping-lists/{id}/receipt. */
export interface ApiReceiptAccepted {
  invoiceId: string | null;
  status: "queued" | null;
  extractionMethod: ApiExtractionMethod | null;
}

export interface ApiShoppingListDetail extends ApiShoppingListSummary {
  groupId: string;
  updatedAt: string;
  items: ApiShoppingItem[];
  receipt?: ApiReceiptSummary | null;
}

export type ApiInvoiceStatus = "queued" | "processing" | "done" | "failed" | "needs_review";

export interface ApiInvoice {
  id: string;
  groupId: string | null;
  uploadedByUserId: string;
  expenseId: string | null;
  shoppingListId: string | null;
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
