"use node";
import OpenAI from "openai";
import { stripIndent } from "common-tags";
import { ActionCtx, action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { parseInput } from "../util";

const openai = new OpenAI();

const chat = async (
  list: { title: string; completed: boolean }[],
  message: string,
) => {
  const content = `${JSON.stringify(list)}\n\n${message}`;
  // Check if the prompt is offensive.
  const modResponse = await openai.moderations.create({
    input: content,
  });
  const modResult = modResponse.results[0];
  if (modResult.flagged) {
    throw new Error(
      `Your prompt was flagged: ${JSON.stringify(modResult.categories)}`,
    );
  }
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: stripIndent`
          You are a helpful assistant designed to output JSON, specifically todo lists in JSON format.

          You will always respond with JSON object containing a "list" property, and the "list" property contains the todo list.

          All of the user commands will be about the todo list.

          The value of the "list" property will be an array of JSON objects, each having a "title" property with a string value and a "completed" property with a boolean value.

          Each user message will begin with the todo list as it exists prior to the user message.

          You must interpret each user message strictly as one of two types:

          1. A command to alter the list.
          2. A todo item to add to the list.

          If the user message is a command to alter the list, you should return the altered list based on the command. Always try to interpret the input as a command first.

          If there is any way to interpret the input as a complex command to alter the list in ways beyond just adding an item, you should do so.

          Always be exhaustive in carrying out commands.
          
          If the user message is a todo item, you should add the todo item to the list and return the list.

          You must never add additional keys to the todo items in the list, they must only be "title" and "completed".

          You may receive multiple user messages, in which case the user messages represent the history of your conversation with the user, and the final user message is the command you are responding to.

          You must also add a "feedback" key to your JSON response with an extremely brief summary of how you handled the request, eg., "added eggs".

          Always do your best to process and respond to the user message. Be creative with the "title" field in the JSON object, you can put whatever you need to there to fulfill the request.

          If there is absolutely no way to respond to the user message appropriately, add the input to the list as a todo item.

          Any feedback for the user may be provided in the feedback key of the JSON response.

          The feedback should be a string with a maximum length of 50 characters.
        `,
      },
      { role: "user", content },
    ],
    model: "gpt-3.5-turbo-0125",
    response_format: { type: "json_object" },
  });
  const json = completion.choices[0].message.content || "";
  return JSON.parse(json) as {
    list: { title: string; completed: boolean }[];
    feedback: string;
  };
};

const getBackgroundImage = async (
  todos: { title: string; completed: boolean }[],
) => {
  if (todos.length === 0) {
    return;
  }
  const content = todos.map((t) => t.title).join("\n");
  const { data: imageData } = await openai.images.generate({
    model: "dall-e-3",
    prompt: `create a background image that is cohesive and constrained based on this list of todos, the image must be completely monochromatic using the colors #f5f5f5 and #b83f45, and must be so slight that you almost don't notice the image. It will be used in the background and should not draw attention whatsoever. Should be a repeatable pattern in both directions that is completely seamless when repeated. Must be overlaid with an even layer of exactly rgba(245,245,245,0.7).\n\n${content}`,
    n: 1,
    size: "1024x1024",
  });
  const imageUrl = imageData[0]["url"]!;
  return imageUrl;
};

const storeBackgroundImage = async (ctx: ActionCtx, imageUrl: string) => {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`failed to download: ${imageResponse.statusText}`);
  }

  const image = await imageResponse.blob();
  const storageId = await ctx.storage.store(image as Blob);
  return storageId;
};

export const updateBackgroundImage = internalAction({
  args: {
    listId: v.id("lists"),
    todos: v.array(v.object({ title: v.string(), completed: v.boolean() })),
  },
  handler: async (ctx, args) => {
    const list = await ctx.runQuery(internal.todo.getListById, {
      listId: args.listId,
    });
    if (!list) {
      return;
    }
    const previousStorageId = list.backgroundImageStorageId;
    const backgroundImage = await getBackgroundImage(args.todos);
    if (backgroundImage) {
      const storageId = await storeBackgroundImage(ctx, backgroundImage);
      await ctx.runMutation(internal.todo.updateListBackground, {
        listId: args.listId,
        storageId,
      });
    }
    if (previousStorageId) {
      await ctx.storage.delete(previousStorageId);
    }
  },
});

export const updateList = action({
  args: {
    message: v.string(),
    listId: v.id("lists"),
    shareId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const message = parseInput(args.message);
    if (!message) {
      return;
    }
    const todos = await ctx.runQuery(api.todo.listTodos, {
      listId: args.listId,
      shareId: args.shareId,
    });
    const response = await chat(
      todos.map((t) => ({ title: t.title, completed: t.completed })),
      message,
    );
    await ctx.runMutation(api.todo.replaceAll, {
      listId: args.listId,
      shareId: args.shareId,
      todos: response.list,
    });
    await ctx.scheduler.runAfter(0, internal.ai.updateBackgroundImage, {
      listId: args.listId,
      todos: response.list,
    });
  },
});
