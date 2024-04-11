import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listItems = query({
	handler: async (ctx) => {
		return ctx.db.query("todos").collect();
	},
});

export const addItem = mutation({
	args: {
		title: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("todos", { title: args.title, completed: false });
	},
});

export const toggleItem = mutation({
	args: {
		id: v.id("todos"),
	},
	handler: async (ctx, args) => {
		const todo = await ctx.db.get(args.id);
		await ctx.db.patch(args.id, { completed: !todo.completed });
	},
});

export const updateItem = mutation({
	args: {
		id: v.id("todos"),
		title: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, { title: args.title });
	},
});

export const removeItem = mutation({
	args: {
		id: v.id("todos"),
	},
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
});

export const toggleAll = mutation({
	args: {
		completed: v.boolean(),
	},
	handler: async (ctx, args) => {
		const todos = await ctx.db.query("todos").collect();
		await Promise.all(
			todos.map((todo) => {
				return todo.patch({ completed: args.completed });
			}),
		);
	},
});

export const removeCompleted = mutation({
	args: {},
	handler: async (ctx) => {
		const todos = await ctx.db.query("todos").collect();
		await Promise.all(
			todos
				.filter((todo) => todo.completed)
				.map((todo) => ctx.db.delete(todo._id)),
		);
	},
});
