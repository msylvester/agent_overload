const ID_COLUMNS = new Set([
  "id",
  "userId",
  "chatId",
  "messageId",
  "documentId",
]);

const JSON_COLUMNS = new Set(["parts", "attachments", "result", "lastContext"]);

const TEXT_TRUNCATE_COLUMNS = new Set([
  "title",
  "originalText",
  "suggestedText",
  "content",
  "description",
  "error",
]);

const MAX_LEN = 120;

export function maskPassword(value: unknown): string {
  return value ? "••••••••" : "—";
}

export function shortId(value: string): string {
  if (value.length <= 10) return value;
  return `${value.slice(0, 8)}…`;
}

export function truncateJson(value: unknown, max: number = MAX_LEN): string {
  const json = JSON.stringify(value) ?? "null";
  if (json.length <= max) return json;
  return `${json.slice(0, max)}…`;
}

function truncateString(value: string, max: number = MAX_LEN): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

export type FormattedCell = {
  display: string;
  title?: string;
};

export function formatCell(column: string, value: unknown): FormattedCell {
  if (value === null || value === undefined) {
    return { display: "—" };
  }

  if (column === "password") {
    return { display: maskPassword(value) };
  }

  if (value instanceof Date) {
    const iso = value.toISOString();
    return { display: iso, title: iso };
  }

  if (typeof value === "boolean") {
    return { display: value ? "true" : "false" };
  }

  if (typeof value === "number") {
    return { display: String(value) };
  }

  if (typeof value === "string") {
    if (ID_COLUMNS.has(column)) {
      return { display: shortId(value), title: value };
    }
    if (TEXT_TRUNCATE_COLUMNS.has(column)) {
      return { display: truncateString(value), title: value };
    }
    return { display: value };
  }

  if (JSON_COLUMNS.has(column) || typeof value === "object") {
    const json = truncateJson(value);
    return { display: json, title: JSON.stringify(value) };
  }

  return { display: String(value) };
}
