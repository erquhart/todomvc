import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  todos: defineTable({
    title: v.string(),
    completed: v.boolean(),
    listId: v.id("lists"),
  })
    .index("by_listId", ["listId"])
    .index("by_listId_completed", ["listId", "completed"]),
  users: defineTable({
    clerkId: v.string(),
  }).index("by_clerkId", ["clerkId"]),
  lists: defineTable({
    shareId: v.string(),
    userId: v.id("users"),
    backgroundImageStorageId: v.optional(v.id("_storage")),
  })
    .index("by_userId", ["userId"])
    .index("by_shareId", ["shareId"]),
});
