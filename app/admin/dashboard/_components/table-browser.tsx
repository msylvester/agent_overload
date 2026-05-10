import Link from "next/link";

import { PAGE_SIZE, TABLE_NAMES, type TableName } from "../_lib/admin-data";
import { formatCell } from "../_lib/format";

type TableBrowserProps = {
  table: TableName;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  page: number;
  total: number;
};

function tabHref(name: TableName) {
  return `/admin/dashboard?table=${name}&page=1`;
}

function pageHref(name: TableName, page: number) {
  return `/admin/dashboard?table=${name}&page=${page}`;
}

export default function TableBrowser({
  table,
  columns,
  rows,
  page,
  total,
}: TableBrowserProps) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const startIdx = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(total, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {TABLE_NAMES.map((name) => {
          const active = name === table;
          return (
            <Link
              key={name}
              href={tabHref(name)}
              className={`px-3 py-1 border-2 text-[10px] tracking-[2px] uppercase ${
                active
                  ? "border-[#d4a853] text-[#d4a853] bg-[#1f1a12]"
                  : "border-[#474747] text-[#c0b896] hover:text-[#f0e6d2]"
              }`}
            >
              {name}
            </Link>
          );
        })}
      </div>

      <div className="border-4 border-[#2b2b2b] bg-[#141016] shadow-[0_0_0_4px_#4e4e4e,0_0_16px_rgba(0,0,0,0.5)] overflow-x-auto">
        <table className="w-full border-collapse text-[10px] font-mono">
          <thead>
            <tr className="bg-[#050608]">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-2 py-2 text-left text-[#d4a853] tracking-[1px] uppercase border border-[#2b2b2b]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-2 py-4 text-center text-[#c0b896]"
                >
                  No rows
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr
                // biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable single key (vote uses composite)
                key={i}
                className={
                  i % 2 === 0 ? "bg-[#171217]" : "bg-[#1c1820]"
                }
              >
                {columns.map((col) => {
                  const cell = formatCell(col, row[col]);
                  return (
                    <td
                      key={col}
                      title={cell.title}
                      className="px-2 py-1.5 border border-[#2b2b2b] text-[#f0e6d2] align-top whitespace-pre-wrap break-all"
                    >
                      {cell.display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[10px] tracking-[1px] text-[#c0b896]">
        <div>
          {startIdx}-{endIdx} of {total.toLocaleString()}
        </div>
        <div className="flex gap-2">
          {hasPrev ? (
            <Link
              href={pageHref(table, page - 1)}
              className="px-3 py-1 border-2 border-[#555555] bg-[linear-gradient(#373737,#181818)] text-[#f5f5dc] uppercase tracking-[2px]"
            >
              Prev
            </Link>
          ) : (
            <span className="px-3 py-1 border-2 border-[#2b2b2b] text-[#555555] uppercase tracking-[2px]">
              Prev
            </span>
          )}
          <span className="px-2 py-1">
            Page {page} / {totalPages}
          </span>
          {hasNext ? (
            <Link
              href={pageHref(table, page + 1)}
              className="px-3 py-1 border-2 border-[#555555] bg-[linear-gradient(#373737,#181818)] text-[#f5f5dc] uppercase tracking-[2px]"
            >
              Next
            </Link>
          ) : (
            <span className="px-3 py-1 border-2 border-[#2b2b2b] text-[#555555] uppercase tracking-[2px]">
              Next
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
