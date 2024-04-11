import { useMutation, useQuery } from "convex/react";
import "./app.css";
import { useLocation } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { useEffect, useMemo } from "react";
import { Input } from "./input";
import classnames from "classnames";
import { Item } from "./item";
import { Id } from "../convex/_generated/dataModel";
import { OptimisticUpdate } from "convex/browser";
import { SignOutButton } from "@clerk/clerk-react";

const addItemOptimisticUpdate: OptimisticUpdate<{ title: string }> = (
  localStore,
  args,
) => {
  const user = localStore.getQuery(api.todo.getCurrentUser);
  if (!user) {
    return;
  }
  const currentValue = localStore.getQuery(api.todo.listItems);
  if (currentValue !== undefined) {
    localStore.setQuery(api.todo.listItems, {}, [
      ...currentValue,
      {
        _id: `${Date.now()}` as Id<"todos">,
        _creationTime: Date.now(),
        userId: user._id,
        title: args.title,
        completed: false,
      },
    ]);
  }
};

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
  const user = useQuery(api.todo.getCurrentUser);

  useEffect(() => {
    syncUser();
  }, []);

  const todos = useQuery(api.todo.listItems, user ? {} : "skip") || [];
  const addItem = useMutation(api.todo.addItem).withOptimisticUpdate(
    addItemOptimisticUpdate,
  );
  const removeCompleted = useMutation(
    api.todo.removeCompleted,
  ).withOptimisticUpdate(removeCompletedOptimisticUpdate);
  const toggleAll = useMutation(api.todo.toggleAll).withOptimisticUpdate(
    toggleAllOptimisticUpdate,
  );

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
          <h1>todos</h1>
          <Input
            onSubmit={(value) => addItem({ title: value })}
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
          <ul className={classnames("todo-list")} data-testid="todo-list">
            {visibleTodos.map((todo) => (
              <Item todo={todo} key={todo._id} />
            ))}
          </ul>
        </main>
        {todos.length > 0 && (
          <footer className="footer" data-testid="footer">
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
