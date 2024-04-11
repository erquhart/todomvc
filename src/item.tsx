import { memo, useState, useCallback } from "react";
import classnames from "classnames";

import { Input } from "./input";

import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { OptimisticUpdate } from "convex/browser";
import { Id } from "../convex/_generated/dataModel";

const toggleItemOptimisticUpdate: OptimisticUpdate<{ id: Id<"todos"> }> = (
  localStore,
  args,
) => {
  const currentValue = localStore.getQuery(api.todo.listItems);
  if (currentValue !== undefined) {
    localStore.setQuery(
      api.todo.listItems,
      {},
      currentValue.map((todo) =>
        todo._id === args.id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }
};

const removeItemOptimisticUpdate: OptimisticUpdate<{ id: Id<"todos"> }> = (
  localStore,
  args,
) => {
  const currentValue = localStore.getQuery(api.todo.listItems);
  if (currentValue !== undefined) {
    localStore.setQuery(
      api.todo.listItems,
      {},
      currentValue.filter((todo) => todo._id !== args.id),
    );
  }
};

const updateItemOptimisticUpdate: OptimisticUpdate<{
  id: Id<"todos">;
  title: string;
}> = (localStore, args) => {
  const currentValue = localStore.getQuery(api.todo.listItems);
  if (currentValue !== undefined) {
    localStore.setQuery(
      api.todo.listItems,
      {},
      currentValue.map((todo) =>
        todo._id === args.id ? { ...todo, title: args.title } : todo,
      ),
    );
  }
};

export const Item = memo(function Item({ todo }: { todo: any }) {
  const [isWritable, setIsWritable] = useState(false);

  const toggleItem = useMutation(api.todo.toggleItem).withOptimisticUpdate(
    toggleItemOptimisticUpdate,
  );
  const removeItem = useMutation(api.todo.removeItem).withOptimisticUpdate(
    removeItemOptimisticUpdate,
  );
  const updateItem = useMutation(api.todo.updateItem).withOptimisticUpdate(
    updateItemOptimisticUpdate,
  );

  const handleDoubleClick = useCallback(() => {
    setIsWritable(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsWritable(false);
  }, []);

  const handleUpdate = useCallback(
    (title: string) => {
      if (title.length === 0) removeItem({ id: todo._id });
      else updateItem({ id: todo._id, title });

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
              onChange={() => toggleItem({ id: todo._id })}
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
              onClick={() => removeItem({ id: todo._id })}
            />
          </>
        )}
      </div>
    </li>
  );
});
