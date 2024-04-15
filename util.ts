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

export const parseInput = (value: string) => {
  if (!hasValidMin(value, 2)) {
    return;
  }
  return sanitize(value);
};
