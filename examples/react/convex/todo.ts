import { v4 as uuidv4 } from "uuid";
import { v } from "convex/values";
import {
  QueryCtx,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getUserById = internalQuery({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

const getCurrentClerkId = async (ctx: QueryCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity || !identity.emailVerified) {
    throw new Error("Unauthorized");
  }
  return identity.subject;
};

const getUserByClerkId = async (ctx: QueryCtx, clerkId: string) => {
  return ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .unique();
};

const getCurrentUser = async (ctx: QueryCtx) => {
  const clerkId = await getCurrentClerkId(ctx);
  const user = await getUserByClerkId(ctx, clerkId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

const getCurrentUserQuery = query(async (ctx, args) => {
  const clerkId = await getCurrentClerkId(ctx);
  return await getUserByClerkId(ctx, clerkId);
});
export { getCurrentUserQuery as getCurrentUser };

export const syncUser = mutation(async (ctx) => {
  const clerkId = await getCurrentClerkId(ctx);
  const user = await getUserByClerkId(ctx, clerkId);
  if (user) {
    return;
  }
  const shareId = uuidv4();
  const userId = await ctx.db.insert("users", { clerkId });
  await ctx.db.insert("lists", { shareId, userId });
});

const authorizeListAccess = async (
  ctx: QueryCtx,
  listId: Id<"lists">,
  shareId?: string,
) => {
  const user = await getCurrentUser(ctx);
  const list = await ctx.db.get(listId);
  if (!list) {
    throw new Error("List not found");
  }
  if (user._id !== list.userId && list.shareId !== shareId) {
    throw new Error("Unauthorized");
  }
};

const getTodo = async (
  ctx: QueryCtx,
  todoId: Id<"todos">,
  shareId?: string,
) => {
  const todo = await ctx.db.get(todoId);
  if (!todo) {
    throw new Error("Todo not found");
  }
  await authorizeListAccess(ctx, todo.listId, shareId);
  return todo;
};

const listTodos = async (
  ctx: QueryCtx,
  listId: Id<"lists">,
  { completed, shareId }: { completed?: boolean; shareId?: string } = {},
) => {
  await authorizeListAccess(ctx, listId, shareId);
  if (completed === undefined) {
    return ctx.db
      .query("todos")
      .withIndex("by_listId", (q) => q.eq("listId", listId))
      .collect();
  }
  return ctx.db
    .query("todos")
    .withIndex("by_listId_completed", (q) =>
      q.eq("listId", listId).eq("completed", completed),
    )
    .collect();
};

const listTodosQuery = query({
  args: {
    listId: v.id("lists"),
    shareId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return listTodos(ctx, args.listId, args);
  },
});
export { listTodosQuery as listTodos };

export const getList = query({
  args: {
    shareId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const shareId = args.shareId;
    if (!shareId) {
      const user = await getCurrentUser(ctx);
      const list = await ctx.db
        .query("lists")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      const backgroundImageUrl =
        list?.backgroundImageStorageId &&
        (await ctx.storage.getUrl(list.backgroundImageStorageId));
      return { ...list, backgroundImageUrl };
    }
    const list = await ctx.db
      .query("lists")
      .withIndex("by_shareId", (q) => q.eq("shareId", shareId))
      .unique();
    if (!list) {
      throw new Error("List not found");
    }
    await authorizeListAccess(ctx, list._id, args.shareId);
    const backgroundImageUrl =
      list?.backgroundImageStorageId &&
      (await ctx.storage.getUrl(list.backgroundImageStorageId));
    return { ...list, backgroundImageUrl };
  },
});

export const toggleItem = mutation({
  args: {
    id: v.id("todos"),
    shareId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const todo = await getTodo(ctx, args.id, args.shareId);
    await ctx.db.patch(todo._id, { completed: !todo?.completed });
  },
});

export const updateItem = mutation({
  args: {
    id: v.id("todos"),
    title: v.string(),
    shareId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const todo = await getTodo(ctx, args.id, args.shareId);
    await ctx.db.patch(todo._id, { title: args.title });
  },
});

export const removeItem = mutation({
  args: {
    id: v.id("todos"),
    shareId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const todo = await getTodo(ctx, args.id, args.shareId);
    await ctx.db.delete(todo._id);
  },
});

export const toggleAll = mutation({
  args: {
    completed: v.boolean(),
    listId: v.id("lists"),
    shareId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const todos = await listTodos(ctx, args.listId, { shareId: args.shareId });
    await Promise.all(
      todos.map((todo) => {
        return ctx.db.patch(todo._id, { completed: args.completed });
      }),
    );
  },
});

export const removeCompleted = mutation({
  args: {
    listId: v.id("lists"),
    shareId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const todos = await listTodos(ctx, args.listId, {
      shareId: args.shareId,
      completed: true,
    });
    await Promise.all(
      todos
        .filter((todo) => todo.completed)
        .map((todo) => ctx.db.delete(todo._id)),
    );
  },
});

export const replaceAll = mutation({
  args: {
    listId: v.id("lists"),
    shareId: v.optional(v.string()),
    todos: v.array(v.object({ title: v.string(), completed: v.boolean() })),
  },
  handler: async (ctx, args) => {
    const todos = await listTodos(ctx, args.listId, { shareId: args.shareId });
    await Promise.all(todos.map((todo) => ctx.db.delete(todo._id)));
    await Promise.all(
      args.todos.map((todo) =>
        ctx.db.insert("todos", {
          listId: args.listId,
          title: todo.title,
          completed: todo.completed,
        }),
      ),
    );
  },
});

export const updateListBackground = internalMutation({
  args: {
    listId: v.id("lists"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.listId, {
      backgroundImageStorageId: args.storageId,
    });
  },
});

export const getListById = internalQuery({
  args: {
    listId: v.id("lists"),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.listId);
  },
});
