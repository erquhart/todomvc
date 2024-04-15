import { v } from "convex/values";
import { QueryCtx, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

const getUserTodo = async (ctx: QueryCtx, todoId: Id<"todos">) => {
  const user = await getCurrentUser(ctx);
  const todo = await ctx.db.get(todoId);
  if (!todo || todo.userId !== user._id) {
    throw new Error("Unauthorized");
  }
  return todo;
};

const getUserTodos = async (
  ctx: QueryCtx,
  { completed }: { completed?: boolean } = {},
) => {
  const user = await getCurrentUser(ctx);
  if (completed === undefined) {
    return ctx.db
      .query("todos")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  }
  return ctx.db
    .query("todos")
    .withIndex("by_userId_completed", (q) =>
      q.eq("userId", user._id).eq("completed", completed),
    )
    .collect();
};

const getCurrentUserQuery = query(async (ctx) => {
  const clerkId = await getCurrentClerkId(ctx);
  return getUserByClerkId(ctx, clerkId);
});
export { getCurrentUserQuery as getCurrentUser };

export const syncUser = mutation(async (ctx) => {
  const clerkId = await getCurrentClerkId(ctx);
  const user = await getUserByClerkId(ctx, clerkId);
  if (user) {
    return;
  }
  await ctx.db.insert("users", { clerkId });
});

export const listItems = query(async (ctx) => {
  return getUserTodos(ctx);
});

export const addItem = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await ctx.db.insert("todos", {
      userId: user._id,
      title: args.title,
      completed: false,
    });
  },
});

export const toggleItem = mutation({
  args: {
    id: v.id("todos"),
  },
  handler: async (ctx, args) => {
    const todo = await getUserTodo(ctx, args.id);
    await ctx.db.patch(todo._id, { completed: !todo?.completed });
  },
});

export const updateItem = mutation({
  args: {
    id: v.id("todos"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const todo = await getUserTodo(ctx, args.id);
    await ctx.db.patch(todo._id, { title: args.title });
  },
});

export const removeItem = mutation({
  args: {
    id: v.id("todos"),
  },
  handler: async (ctx, args) => {
    const todo = await getUserTodo(ctx, args.id);
    await ctx.db.delete(todo._id);
  },
});

export const toggleAll = mutation({
  args: {
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const todos = await getUserTodos(ctx);
    await Promise.all(
      todos.map((todo) => {
        return ctx.db.patch(todo._id, { completed: args.completed });
      }),
    );
  },
});

export const removeCompleted = mutation({
  args: {},
  handler: async (ctx) => {
    const todos = await getUserTodos(ctx, { completed: true });
    await Promise.all(
      todos
        .filter((todo) => todo.completed)
        .map((todo) => ctx.db.delete(todo._id)),
    );
  },
});

export const listAll = query(async (ctx) => {
  const user = await getCurrentUser(ctx);
  return ctx.db
    .query("todos")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .collect();
});

export const replaceAll = mutation({
  args: {
    todos: v.array(v.object({ title: v.string(), completed: v.boolean() })),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const currentTodos = await getUserTodos(ctx);
    await Promise.all(currentTodos.map((todo) => ctx.db.delete(todo._id)));
    await Promise.all(
      args.todos.map((todo) =>
        ctx.db.insert("todos", {
          userId: user._id,
          title: todo.title,
          completed: todo.completed,
        }),
      ),
    );
  },
});
