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

/** De onde veio o resultado da leitura. */
/** Valores de invoices.resolution_path na API; "" quando a leitura ainda não terminou. */
export type ApiReceiptResolutionPath =
  | ""
  | "submitted_qr"
  | "submitted_key"
  | "photo_qr"
  | "photo_key"
  | "ocr"
  | "ocr_escalated";

export interface ApiReceiptRetry {
  allowed: boolean;
  remaining: number;
}

/** GET /shopping-lists/{id}/receipt. items, matches, establishment e total ficam vazios enquanto a nota está na fila ou sendo lida. */
export interface ApiShoppingReceipt extends ApiReceiptSummary {
  resolutionPath: ApiReceiptResolutionPath | null;
  /** Ausente quando a API não oferece nova leitura: trate como não permitido. */
  retry?: ApiReceiptRetry;
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
  /** A lista enviou esta nota como comprovante: troca-se pela lista, não se exclui em Notas. */
  sentFromList: boolean;
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
  /** Origem da leitura: "", ocr, ocr_escalated, submitted_qr, submitted_key, photo_qr, photo_key. */
  resolutionPath?: string;
  /** Foto enviada com URL assinada e temporária; null na nota pelo QR code. Só vem no detalhe. */
  file?: ApiReceiptFile | null;
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

/** `GET /me/dashboard`: Painel inteiro numa chamada (meses em America/Sao_Paulo). */
export interface ApiDashboard {
  totals: { receivesCents: number; owesCents: number };
  monthSpend: { currentCents: number; previousCents: number; month: string };
  groups: { id: string; name: string; emoji: string; netCents: number; membersCount: number }[];
  /** Mesmas linhas de `GET /notifications?status=all&limit=3`. */
  recent: ApiNotification[];
  unpaidCount: number;
}

export type ApiInviteStatus = "active" | "expired" | "revoked" | "exhausted";

/** Visão de admin de `GET /groups/{id}/invites`; nunca traz o token. */
export interface ApiGroupInvite {
  id: string;
  groupId: string;
  /** Id de quem criou. */
  createdBy: string;
  email: string | null;
  maxUses: number;
  uses: number;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  status: ApiInviteStatus;
}

/** `POST /groups/{id}/invites`: o link com o token só volta aqui, uma vez. */
export interface ApiGroupInviteCreated {
  invite: ApiGroupInvite;
  token: string;
  url: string;
  /** false sem e-mail ou quando o envio falhou. */
  emailSent: boolean;
}

/** `POST /invites/preview`, público. */
export interface ApiInvitePreview {
  group: { name: string; emoji: string };
  inviterName: string;
  expiresAt: string;
}

/** `POST /invites/accept`; `joined=false` quando já era membro. */
export interface ApiInviteAccepted {
  groupId: string;
  joined: boolean;
}
