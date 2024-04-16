import { memo, useState, useCallback } from "react";
import classnames from "classnames";

import { Input } from "./input";

import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { OptimisticUpdate } from "convex/browser";
import { Doc, Id } from "../convex/_generated/dataModel";
import { useShareId } from "./util";

const listTodosOptimisticUpdate = (
  listId: Id<"lists">,
  updateList: (currentValue: Doc<"todos">[], id: Id<"todos">) => Doc<"todos">[],
): OptimisticUpdate<{ id: Id<"todos">; shareId?: string }> => {
  return (localStore, args) => {
    const currentValue = localStore.getQuery(api.todo.listTodos, {
      listId,
      shareId: args.shareId,
    });
    if (currentValue !== undefined) {
      localStore.setQuery(
        api.todo.listTodos,
        { listId, shareId: args.shareId },
        updateList(currentValue, args.id),
      );
    }
  };
};

export const Item = memo(function Item({ todo }: { todo: any }) {
  const shareId = useShareId();
  const [isWritable, setIsWritable] = useState(false);

  const toggleItem = useMutation(api.todo.toggleItem).withOptimisticUpdate(
    listTodosOptimisticUpdate(todo.listId, (todos, id) =>
      todos.map((t) => (t._id === id ? { ...t, completed: !t.completed } : t)),
    ),
  );
  const removeItem = useMutation(api.todo.removeItem).withOptimisticUpdate(
    listTodosOptimisticUpdate(todo.listId, (todos, id) =>
      todos.filter((todo) => todo._id !== id),
    ),
  );
  const updateItem = useMutation(api.todo.updateItem);

  const handleDoubleClick = useCallback(() => {
    setIsWritable(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsWritable(false);
  }, []);

  const handleUpdate = useCallback(
    (title: string) => {
      if (title.length === 0) removeItem({ id: todo._id });
      else updateItem({ id: todo._id, title, shareId });

      setIsWritable(false);
    },
    [todo._id, removeItem, updateItem],
  );

  return (
    <li
      className={classnames({ completed: todo.completed })}
      data-testid="todo-item"
    >
      <div className="view">
        {isWritable ? (
          <Input
            onSubmit={handleUpdate}
            label="Edit Todo Input"
            defaultValue={todo.title}
            onBlur={handleBlur}
          />
        ) : (
          <>
            <input
              className="toggle"
              type="checkbox"
              data-testid="todo-item-toggle"
              checked={todo.completed}
              onChange={() => toggleItem({ id: todo._id, shareId })}
            />
            <label
              data-testid="todo-item-label"
              onDoubleClick={handleDoubleClick}
            >
              {todo.title}
            </label>
            <button
              className="destroy"
              data-testid="todo-item-button"
              onClick={() => removeItem({ id: todo._id, shareId })}
            />
          </>
        )}
      </div>
    </li>
  );
});
