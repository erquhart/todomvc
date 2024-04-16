import { useAction, useMutation, useQuery } from "convex/react";
import "./app.css";
import { useLocation } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { useEffect, useMemo, useState } from "react";
import { Input } from "./input";
import classnames from "classnames";
import { Item } from "./item";
import { OptimisticUpdate } from "convex/browser";
import { SignOutButton } from "@clerk/clerk-react";
import { SpinnerCircularFixed } from "spinners-react";

const removeCompletedOptimisticUpdate: OptimisticUpdate<{}> = (localStore) => {
  const currentValue = localStore.getQuery(api.todo.listItems);
  if (currentValue !== undefined) {
    localStore.setQuery(
      api.todo.listItems,
      {},
      currentValue.filter((todo) => !todo.completed),
    );
  }
};

const toggleAllOptimisticUpdate: OptimisticUpdate<{ completed: boolean }> = (
  localStore,
  args,
) => {
  const currentValue = localStore.getQuery(api.todo.listItems);
  if (currentValue !== undefined) {
    localStore.setQuery(
      api.todo.listItems,
      {},
      currentValue.map((todo) => ({
        ...todo,
        completed: args.completed,
      })),
    );
  }
};

export function Main() {
  const { hash } = useLocation();
  const syncUser = useMutation(api.todo.syncUser);
  const user = useQuery(api.todo.getCurrentUser, {
    includeBackgroundImage: true,
  });

  useEffect(() => {
    syncUser();
  }, []);

  useEffect(() => {
    if (user?.backgroundImageStorageId) {
      document.documentElement.style.backgroundImage = `url('${user.backgroundImageUrl}')`;
    }
  }, [user]);

  const todos = useQuery(api.todo.listItems, user ? {} : "skip") || [];
  const updateList = useAction(api.ai.updateList);
  const removeCompleted = useMutation(
    api.todo.removeCompleted,
  ).withOptimisticUpdate(removeCompletedOptimisticUpdate);
  const toggleAll = useMutation(api.todo.toggleAll).withOptimisticUpdate(
    toggleAllOptimisticUpdate,
  );

  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateList = async (value: string) => {
    setIsUpdating(true);
    await updateList({ message: value });
    setIsUpdating(false);
  };

  const visibleTodos = useMemo(
    () =>
      todos.filter((todo) => {
        if (hash === "#/active") return !todo.completed;
        if (hash === "#/completed") return todo.completed;
        return todo;
      }),
    [todos, hash],
  );

  const activeTodos = useMemo(
    () => todos.filter((todo) => !todo.completed),
    [todos],
  );

  return (
    <>
      <section className="todoapp">
        <SignOutButton>
          <button className="logout-button">sign out</button>
        </SignOutButton>
        <header className="header" data-testid="header">
          <h1>todos.ai</h1>
          <Input
            onSubmit={handleUpdateList}
            label="New Todo Input"
            placeholder="What needs to be done?"
          />
        </header>
        <main className="main" data-testid="main">
          {visibleTodos.length > 0 ? (
            <div className="toggle-all-container">
              <input
                className="toggle-all"
                type="checkbox"
                data-testid="toggle-all"
                checked={visibleTodos.every((todo) => todo.completed)}
                onChange={(e) => toggleAll({ completed: e.target.checked })}
              />
              <label className="toggle-all-label" htmlFor="toggle-all">
                Toggle All Input
              </label>
            </div>
          ) : null}
          <ul className="todo-list" data-testid="todo-list">
            {isUpdating && (
              <div className="todo-list-spinner">
                <SpinnerCircularFixed
                  size={50}
                  thickness={155}
                  speed={146}
                  color="rgba(184, 63, 69, 1)"
                  secondaryColor="rgba(255, 255, 255, 0.12)"
                />
              </div>
            )}
            {visibleTodos.map((todo) => (
              <Item todo={todo} key={todo._id} />
            ))}
          </ul>
        </main>
        {todos.length > 0 && (
          <footer className="footer" data-testid="footer">
            {isUpdating && <div className="todo-list-spinner" />}
            <span className="todo-count">{`${activeTodos.length} ${activeTodos.length === 1 ? "item" : "items"} left!`}</span>
            <ul className="filters" data-testid="footer-navigation">
              <li>
                <a
                  className={classnames({ selected: hash === "#/" })}
                  href="#/"
                >
                  All
                </a>
              </li>
              <li>
                <a
                  className={classnames({ selected: hash === "#/active" })}
                  href="#/active"
                >
                  Active
                </a>
              </li>
              <li>
                <a
                  className={classnames({ selected: hash === "#/completed" })}
                  href="#/completed"
                >
                  Completed
                </a>
              </li>
            </ul>
            <button
              className="clear-completed"
              disabled={activeTodos.length === todos.length}
              onClick={() => removeCompleted()}
            >
              Clear completed
            </button>
          </footer>
        )}
      </section>
      <footer className="info">
        <p>Double-click to edit a todo</p>
        <p>Created by the TodoMVC Team</p>
        <p>
          Part of <a href="http://todomvc.com">TodoMVC</a>
        </p>
        <p>
          Made ✨amazing✨ with <a href="https://convex.dev">Convex</a>
        </p>
      </footer>
    </>
  );
}
