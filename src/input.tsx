import { useCallback } from "react";
import { parseInput } from "../util";

export function Input({
  onSubmit,
  placeholder = "",
  label,
  defaultValue = "",
  onBlur = () => {},
}: {
  onSubmit: (value: string) => void;
  placeholder?: string;
  label: string;
  defaultValue?: string;
  onBlur?: () => void;
}) {
  const handleBlur = useCallback(() => {
    if (onBlur) onBlur();
  }, [onBlur]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const target = e.target as HTMLInputElement;
        const value = target.value.trim();

        const parsedInput = parseInput(value);
        if (!parsedInput) {
          return;
        }
        onSubmit(parsedInput);
        target.value = "";
      }
    },
    [onSubmit],
  );

  return (
    <div className="input-container">
      <input
        className="new-todo"
        id="todo-input"
        type="text"
        data-testid="text-input"
        autoFocus
        placeholder={placeholder}
        defaultValue={defaultValue}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      <label className="visually-hidden" htmlFor="todo-input">
        {label}
      </label>
    </div>
  );
}
