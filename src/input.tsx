import { useCallback } from "react";

const sanitize = (string: string) => {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  const reg = /[&<>"'/]/gi;
  return string.replace(reg, (match) => map[match as keyof typeof map]);
};

const hasValidMin = (value: string, min: number) => {
  return value.length >= min;
};

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

        if (!hasValidMin(value, 2)) return;

        onSubmit(sanitize(value));
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
