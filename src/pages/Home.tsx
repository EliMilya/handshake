import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const [terms, setTerms] = useState("");
  const [creating, setCreating] = useState(false);

  const contracts = useQuery(api.contracts.getMyContracts, isSignedIn ? {} : "skip");
  const createContract = useMutation(api.contracts.create);

  const handleCreate = async () => {
    if (!terms.trim()) return;
    setCreating(true);
    try {
      const id = await createContract({ terms: terms.trim() });
      navigate(`/contract/${id}`);
    } finally {
      setCreating(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Handshake</h1>
          <p className="text-muted-foreground text-lg max-w-md">
            Real-time micro-contracts. Discuss terms and seal the deal
            by holding the button simultaneously.
          </p>
        </div>
        <SignInButton mode="modal">
          <Button size="lg">Sign In</Button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Handshake</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.fullName}</span>
          <UserButton />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Contract</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Describe the contract terms..."
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={4}
          />
          <Button onClick={handleCreate} disabled={creating || !terms.trim()}>
            {creating ? "Creating..." : "Create Contract"}
          </Button>
        </CardContent>
      </Card>

      {contracts && contracts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">My Contracts</h2>
          {contracts.map((contract) => (
            <Card
              key={contract._id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/contract/${contract._id}`)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{contract.terms}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {contract.creatorName}
                      {contract.counterpartyName && ` ↔ ${contract.counterpartyName}`}
                    </p>
                  </div>
                  <Badge variant={contract.status === "sealed" ? "default" : "secondary"}>
                    {contract.status === "sealed" ? "Sealed" : "Negotiating"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
