import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface NegotiationLogProps {
  contractId: Id<"contracts">;
}

export default function NegotiationLog({ contractId }: NegotiationLogProps) {
  const log = useQuery(api.negotiation.getLog, { contractId });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log?.length]);

  if (!log || log.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Change History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-y-auto space-y-3">
          {log.map((entry, i) => (
            <div key={entry._id}>
              {i > 0 && <Separator className="mb-3" />}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{entry.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {entry.proposedTerms}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </CardContent>
    </Card>
  );
}
