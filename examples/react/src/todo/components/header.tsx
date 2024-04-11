import { useCallback } from "react";
import { Input } from "./input";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function Header() {
  const addItem = useMutation(api.todo.addItem);

  return (
    <header className="header" data-testid="header">
      <h1>todos</h1>
      <Input
        onSubmit={(value) => addItem({ title: value })}
        label="New Todo Input"
        placeholder="What needs to be done?"
      />
    </header>
  );
}
