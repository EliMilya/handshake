import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const get = query({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.contractId);
  },
});

export const getMyContracts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userId = identity.subject;

    const asCreator = await ctx.db
      .query("contracts")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .collect();

    const asCounterparty = await ctx.db
      .query("contracts")
      .withIndex("by_counterparty", (q) => q.eq("counterpartyId", userId))
      .collect();

    const all = [...asCreator, ...asCounterparty];
    all.sort((a, b) => b._creationTime - a._creationTime);
    return all;
  },
});

export const create = mutation({
  args: { terms: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("contracts", {
      status: "negotiating",
      creatorId: identity.subject,
      creatorName: identity.name ?? "Anonymous",
      terms: args.terms,
    });
  },
});

export const joinAsCounterparty = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const contract = await ctx.db.get(args.contractId);
    if (!contract) throw new Error("Contract not found");
    if (contract.status === "sealed") throw new Error("Contract is sealed");
    if (contract.counterpartyId) throw new Error("Counterparty slot is taken");
    if (contract.creatorId === identity.subject) return;

    await ctx.db.patch(args.contractId, {
      counterpartyId: identity.subject,
      counterpartyName: identity.name ?? "Anonymous",
    });
  },
});

export const updateTerms = mutation({
  args: { contractId: v.id("contracts"), newTerms: v.string() },
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

    await ctx.db.patch(args.contractId, { terms: args.newTerms });

    await ctx.db.insert("negotiation_log", {
      contractId: args.contractId,
      authorId: userId,
      authorName: identity.name ?? "Anonymous",
      proposedTerms: args.newTerms,
      createdAt: Date.now(),
    });
  },
});
