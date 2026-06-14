import { AppShell } from "@/components/app-shell";
import { QueryTester } from "@/components/query-tester";
import { Surface } from "@/components/surface";
import { databaseProjectUrl, databaseProvider } from "@/lib/db";

export default function QueryTesterPage() {
  return (
    <AppShell
      title="Supabase setup helper"
      description="This app now uses Supabase. Use this page as a reminder of where the project is connected and where raw SQL should be run."
    >
      <Surface
        title="Supabase SQL helper"
        description="Use the Supabase SQL Editor for schema setup, table inspection, and custom reporting."
      >
        <div className="mb-5 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-stone-700">
          Provider: <span className="font-mono text-xs">{databaseProvider}</span>
          <br />
          Project URL: <span className="font-mono text-xs">{databaseProjectUrl}</span>
        </div>
        <QueryTester />
      </Surface>
    </AppShell>
  );
}
