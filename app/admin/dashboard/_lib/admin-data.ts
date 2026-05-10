import "server-only";

import { count, desc, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

import { db } from "@/lib/db/queries";
import {
  chat,
  document,
  job,
  message,
  stream,
  subscriber,
  suggestion,
  user,
  vote,
} from "@/lib/db/schema";

export const PAGE_SIZE = 25;

type TableConfig = {
  table: PgTable;
  orderBy: PgColumn;
  columns: string[];
};

export const TABLES: Record<string, TableConfig> = {
  user: {
    table: user,
    orderBy: user.id,
    columns: ["id", "email"],
  },
  chat: {
    table: chat,
    orderBy: chat.createdAt,
    columns: ["id", "title", "userId", "visibility", "createdAt"],
  },
  message: {
    table: message,
    orderBy: message.createdAt,
    columns: ["id", "chatId", "role", "parts", "createdAt"],
  },
  vote: {
    table: vote,
    orderBy: vote.chatId,
    columns: ["chatId", "messageId", "isUpvoted"],
  },
  document: {
    table: document,
    orderBy: document.createdAt,
    columns: ["id", "title", "kind", "userId", "createdAt"],
  },
  suggestion: {
    table: suggestion,
    orderBy: suggestion.createdAt,
    columns: [
      "id",
      "documentId",
      "originalText",
      "suggestedText",
      "isResolved",
      "createdAt",
    ],
  },
  stream: {
    table: stream,
    orderBy: stream.createdAt,
    columns: ["id", "chatId", "createdAt"],
  },
  job: {
    table: job,
    orderBy: job.createdAt,
    columns: ["id", "chatId", "status", "createdAt", "updatedAt"],
  },
  subscriber: {
    table: subscriber,
    orderBy: subscriber.createdAt,
    columns: ["id", "email", "agreedToTos", "createdAt"],
  },
};

export type TableName = keyof typeof TABLES;

export const TABLE_NAMES = Object.keys(TABLES) as TableName[];

export type Counts = Record<TableName, number>;

export async function getCounts(): Promise<Counts> {
  const entries = await Promise.all(
    TABLE_NAMES.map(async (name) => {
      const cfg = TABLES[name];
      const [row] = await db
        .select({ n: count() })
        .from(cfg.table as PgTable);
      return [name, Number(row?.n ?? 0)] as const;
    }),
  );
  return Object.fromEntries(entries) as Counts;
}

export async function getRows(
  name: TableName,
  page: number,
): Promise<Array<Record<string, unknown>>> {
  const cfg = TABLES[name];
  const offset = (page - 1) * PAGE_SIZE;

  const rows = await db
    .select()
    .from(cfg.table as PgTable)
    .orderBy(desc(cfg.orderBy) as SQL)
    .limit(PAGE_SIZE)
    .offset(offset);

  return rows as Array<Record<string, unknown>>;
}
