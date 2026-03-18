import { v } from "convex/values";
import { query } from "./_generated/server";

export const getLog = query({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("negotiation_log")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .collect();
  },
});
