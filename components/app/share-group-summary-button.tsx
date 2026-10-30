import { ShareButton } from "@/components/app/share-button";
import { buildGroupSummaryShareText, type PendingSettlementLine } from "@/lib/share-text";

export function ShareGroupSummaryButton({
  groupUrl,
  groupName,
  pendingSettlements,
}: {
  groupUrl: string;
  groupName: string;
  pendingSettlements: PendingSettlementLine[];
}) {
  const text = buildGroupSummaryShareText({ groupName, groupUrl, pendingSettlements });

  return <ShareButton text={text} shareTitle={groupName} label="Compartilhar resumo" />;
}
