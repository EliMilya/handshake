import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";

interface SealButtonProps {
  contractId: Id<"contracts">;
}

export default function SealButton({ contractId }: SealButtonProps) {
  const { user } = useUser();
  const [holding, setHolding] = useState(false);
  const [myProgress, setMyProgress] = useState(0);
  const [partnerProgress, setPartnerProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const animFrameRef = useRef<number>(0);

  const startHold = useMutation(api.seal.startHold);
  const releaseHold = useMutation(api.seal.releaseHold);
  const intents = useQuery(api.seal.getIntents, { contractId });

  const partnerIntent = intents?.find((i) => i.userId !== user?.id);

  // Animate partner progress from their holdStartedAt
  useEffect(() => {
    if (!partnerIntent) {
      setPartnerProgress(0);
      return;
    }

    const animate = () => {
      const elapsed = Date.now() - partnerIntent.holdStartedAt;
      setPartnerProgress(Math.min(elapsed / 3000, 1));
      if (elapsed < 3000) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };
    animate();

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [partnerIntent]);

  // Animate my progress locally
  useEffect(() => {
    if (!holding) {
      setMyProgress(0);
      return;
    }

    const animate = () => {
      if (holdStartRef.current === null) return;
      const elapsed = Date.now() - holdStartRef.current;
      setMyProgress(Math.min(elapsed / 3000, 1));
      if (elapsed < 3000) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };
    animate();

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [holding]);

  const handlePointerDown = useCallback(() => {
    setHolding(true);
    holdStartRef.current = Date.now();
    startHold({ contractId }).catch(() => {});
  }, [contractId, startHold]);

  const handleRelease = useCallback(() => {
    if (!holding) return;
    setHolding(false);
    holdStartRef.current = null;
    releaseHold({ contractId }).catch(() => {});
  }, [holding, contractId, releaseHold]);

  // Cleanup on unmount / beforeunload
  useEffect(() => {
    const cleanup = () => {
      if (holdStartRef.current !== null) {
        releaseHold({ contractId }).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", cleanup);
    return () => {
      cleanup();
      window.removeEventListener("beforeunload", cleanup);
    };
  }, [contractId, releaseHold]);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">Seal the Contract</p>
          <p className="text-xs text-muted-foreground">
            Both parties must hold the button for 3 seconds simultaneously
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onPointerDown={handlePointerDown}
            onPointerUp={handleRelease}
            onPointerLeave={handleRelease}
            onPointerCancel={handleRelease}
            className="relative w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center select-none touch-none cursor-pointer transition-transform active:scale-95"
          >
            {/* My progress ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${myProgress * 283} 283`}
                className="text-primary transition-none"
              />
            </svg>

            {/* Partner progress ring (inner) */}
            <svg className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${partnerProgress * 283} 283`}
                className="text-muted-foreground/50 transition-none"
              />
            </svg>

            <span className="text-xs font-medium z-10">
              {holding ? `${Math.ceil(3 - myProgress * 3)}s` : "Hold"}
            </span>
          </button>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground px-4">
          <span>You: {holding ? `${Math.round(myProgress * 100)}%` : "—"}</span>
          <span>
            Partner: {partnerIntent ? `${Math.round(partnerProgress * 100)}%` : "—"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
