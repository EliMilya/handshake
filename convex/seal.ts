import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const getIntents = query({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("seal_intents")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .collect();
  },
});

export const startHold = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const contract = await ctx.db.get(args.contractId);
    if (!contract) throw new Error("Contract not found");
    if (contract.status === "sealed") throw new Error("Contract is sealed");

    const userId = identity.subject;
    if (userId !== contract.creatorId && userId !== contract.counterpartyId) {
      throw new Error("Not a signatory");
    }

    // Upsert: remove existing intent for this user first
    const existing = await ctx.db
      .query("seal_intents")
      .withIndex("by_contract_user", (q) =>
        q.eq("contractId", args.contractId).eq("userId", userId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    await ctx.db.insert("seal_intents", {
      contractId: args.contractId,
      userId,
      holdStartedAt: Date.now(),
    });

    // Check if both parties are now holding
    const allIntents = await ctx.db
      .query("seal_intents")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .collect();

    if (allIntents.length >= 2) {
      // Schedule seal check in 3 seconds
      await ctx.scheduler.runAfter(3000, internal.seal.checkAndSeal, {
        contractId: args.contractId,
      });
    }
  },
});

export const releaseHold = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("seal_intents")
      .withIndex("by_contract_user", (q) =>
        q.eq("contractId", args.contractId).eq("userId", identity.subject)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const checkAndSeal = internalMutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract || contract.status === "sealed") return;

    const intents = await ctx.db
      .query("seal_intents")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .collect();

    if (intents.length < 2) return;

    const now = Date.now();
    const allHeldLongEnough = intents.every(
      (intent) => now - intent.holdStartedAt >= 3000
    );

    if (!allHeldLongEnough) return;

    // Seal the contract
    await ctx.db.patch(args.contractId, {
      status: "sealed",
      sealedTerms: contract.terms,
      sealedAt: now,
    });

    // Clean up intents
    for (const intent of intents) {
      await ctx.db.delete(intent._id);
    }
  },
});
