import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import TermsEditor from "@/components/TermsEditor";
import NegotiationLog from "@/components/NegotiationLog";
import SealButton from "@/components/SealButton";
import ContractReceipt from "@/components/ContractReceipt";
import { Button } from "@/components/ui/button";

export default function Contract() {
  const { id } = useParams<{ id: string }>();
  const { user, isSignedIn } = useUser();
  const contractId = id as Id<"contracts">;

  const contract = useQuery(api.contracts.get, { contractId });
  const joinAsCounterparty = useMutation(api.contracts.joinAsCounterparty);

  // Auto-join as counterparty
  useEffect(() => {
    if (
      contract &&
      isSignedIn &&
      user &&
      contract.status === "negotiating" &&
      !contract.counterpartyId &&
      contract.creatorId !== user.id
    ) {
      joinAsCounterparty({ contractId }).catch(() => {});
    }
  }, [contract, isSignedIn, user, contractId, joinAsCounterparty]);

  if (contract === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (contract === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Contract not found</p>
        <Link to="/">
          <Button variant="outline">Go Home</Button>
        </Link>
      </div>
    );
  }

  const userId = user?.id;
  const isSignatory =
    userId === contract.creatorId || userId === contract.counterpartyId;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <h1 className="text-lg font-semibold">Contract</h1>
        <div className="w-12" />
      </div>

      {contract.status === "sealed" ? (
        <ContractReceipt contract={contract} />
      ) : (
        <>
          <TermsEditor
            contractId={contractId}
            currentTerms={contract.terms}
            isSignatory={isSignatory}
            isSignedIn={!!isSignedIn}
          />

          <NegotiationLog contractId={contractId} />

          {isSignatory && contract.counterpartyId && (
            <SealButton contractId={contractId} />
          )}

          {isSignatory && !contract.counterpartyId && (
            <div className="text-center p-4 border border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Waiting for the other party...
              </p>
              <p className="text-xs text-muted-foreground">
                Share the link:{" "}
                <button
                  className="underline cursor-pointer"
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                >
                  copy
                </button>
              </p>
            </div>
          )}

          {!isSignatory && isSignedIn && contract.counterpartyId && (
            <p className="text-center text-sm text-muted-foreground">
              You are an observer — the counterparty slot is already taken.
            </p>
          )}
        </>
      )}
    </div>
  );
}
