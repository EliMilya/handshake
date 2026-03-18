import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TermsEditorProps {
  contractId: Id<"contracts">;
  currentTerms: string;
  isSignatory: boolean;
  isSignedIn: boolean;
}

export default function TermsEditor({
  contractId,
  currentTerms,
  isSignatory,
  isSignedIn,
}: TermsEditorProps) {
  const [draft, setDraft] = useState(currentTerms);
  const [submitting, setSubmitting] = useState(false);
  const updateTerms = useMutation(api.contracts.updateTerms);

  const hasChanges = draft.trim() !== currentTerms;

  const handleSubmit = async () => {
    if (!hasChanges) return;
    setSubmitting(true);
    try {
      await updateTerms({ contractId, newTerms: draft.trim() });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contract Terms</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isSignatory && isSignedIn ? (
          <>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              placeholder="Contract terms..."
            />
            <Button
              onClick={handleSubmit}
              disabled={!hasChanges || submitting}
              size="sm"
            >
              {submitting ? "Submitting..." : "Propose Changes"}
            </Button>
          </>
        ) : (
          <div className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md">
            {currentTerms}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
