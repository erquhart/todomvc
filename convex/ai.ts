"use node";
import OpenAI from "openai";
import { stripIndent } from "common-tags";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const openai = new OpenAI();

const chat = async (
  list: { title: string; completed: boolean }[],
  message: string,
) => {
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
      { role: "user", content: `${JSON.stringify(list)}\n\n${message}` },
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

export const updateList = action({
  args: {
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const todos = await ctx.runQuery(api.todo.listAll);
    const response = await chat(
      todos.map((t) => ({ title: t.title, completed: t.completed })),
      args.message,
    );
    console.log(response);
    await ctx.runMutation(api.todo.replaceAll, { todos: response.list });
  },
});
