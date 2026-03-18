import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ContractReceiptProps {
  contract: {
    creatorName: string;
    counterpartyName?: string;
    sealedTerms?: string;
    sealedAt?: number;
  };
}

export default function ContractReceipt({ contract }: ContractReceiptProps) {
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="text-center">
        <Badge className="mx-auto mb-2" variant="default">
          Sealed
        </Badge>
        <CardTitle>Contract Sealed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Parties</p>
          <p className="text-sm text-muted-foreground">
            {contract.creatorName} ↔ {contract.counterpartyName ?? "—"}
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">Terms</p>
          <div className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md">
            {contract.sealedTerms}
          </div>
        </div>

        <Separator />

        {contract.sealedAt && (
          <p className="text-xs text-muted-foreground text-center">
            Sealed: {new Date(contract.sealedAt).toLocaleString()}
          </p>
        )}

        <Button variant="outline" className="w-full" onClick={handleShare}>
          Copy Link
        </Button>
      </CardContent>
    </Card>
  );
}
