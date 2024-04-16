import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  todos: defineTable({
    title: v.string(),
    completed: v.boolean(),
    userId: v.id("users"),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_completed", ["userId", "completed"]),
  users: defineTable({
    clerkId: v.string(),
    backgroundImageStorageId: v.optional(v.id("_storage")),
  }).index("by_clerkId", ["clerkId"]),
});
