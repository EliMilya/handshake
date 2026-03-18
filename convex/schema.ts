import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  contracts: defineTable({
    status: v.union(v.literal("negotiating"), v.literal("sealed")),
    creatorId: v.string(),
    creatorName: v.string(),
    counterpartyId: v.optional(v.string()),
    counterpartyName: v.optional(v.string()),
    terms: v.string(),
    sealedAt: v.optional(v.number()),
    sealedTerms: v.optional(v.string()),
  })
    .index("by_creator", ["creatorId"])
    .index("by_counterparty", ["counterpartyId"]),

  negotiation_log: defineTable({
    contractId: v.id("contracts"),
    authorId: v.string(),
    authorName: v.string(),
    proposedTerms: v.string(),
    createdAt: v.number(),
  }).index("by_contract", ["contractId"]),

  seal_intents: defineTable({
    contractId: v.id("contracts"),
    userId: v.string(),
    holdStartedAt: v.number(),
  })
    .index("by_contract", ["contractId"])
    .index("by_contract_user", ["contractId", "userId"]),
});
