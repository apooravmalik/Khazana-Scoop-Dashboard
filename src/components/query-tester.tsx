"use client";

import { useActionState } from "react";

import {
  runQueryAction,
  type QueryActionState,
} from "@/app/actions";

const initialState: QueryActionState = {
  columns: [],
  error: "",
  message: "",
  rows: [],
  sql: "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;",
};

export function QueryTester() {
  const [state, formAction, pending] = useActionState(runQueryAction, initialState);

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            SQL statement
          </span>
          <textarea
            name="sql"
            defaultValue={state.sql}
            rows={8}
            className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 font-mono text-sm text-stone-900 outline-none transition focus:border-stone-950"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center rounded-full bg-stone-950 px-5 py-2.5 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Running..." : "Run query"}
          </button>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
            Local SQLite access only
          </p>
        </div>
      </form>

      {state.error ? (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      {state.message ? (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[1.5rem] border border-stone-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
            <thead className="bg-stone-100/80">
              <tr>
                {state.columns.length > 0 ? (
                  state.columns.map((column) => (
                    <th
                      key={column}
                      className="px-4 py-3 font-semibold uppercase tracking-[0.2em] text-stone-500"
                    >
                      {column}
                    </th>
                  ))
                ) : (
                  <th className="px-4 py-3 font-semibold uppercase tracking-[0.2em] text-stone-500">
                    Result
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {state.rows.length > 0 ? (
                state.rows.map((row, index) => (
                  <tr key={`${index}-${Object.values(row).join("-")}`}>
                    {(state.columns.length > 0 ? state.columns : ["Result"]).map(
                      (column) => (
                        <td key={column} className="px-4 py-3 align-top text-stone-700">
                          {String(row[column] ?? "-")}
                        </td>
                      ),
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-stone-500">
                    Query results will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
