import { ShareButton } from "@/components/app/share-button";
import { buildSettlementShareText } from "@/lib/share-text";

export function ChargeSettlementButton({
  groupUrl,
  groupName,
  payerName,
  payeeName,
  amountCents,
  payeePixKey,
}: {
  groupUrl: string;
  groupName: string;
  payerName: string;
  payeeName: string;
  amountCents: number;
  payeePixKey?: string | null;
}) {
  const text = buildSettlementShareText({ groupName, groupUrl, payerName, payeeName, amountCents, payeePixKey });

  return <ShareButton text={text} shareTitle={groupName} label="Cobrar" />;
}
