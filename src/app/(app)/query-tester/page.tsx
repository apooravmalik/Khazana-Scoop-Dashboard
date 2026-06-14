import { AppShell } from "@/components/app-shell";
import { QueryTester } from "@/components/query-tester";
import { Surface } from "@/components/surface";
import { databasePath } from "@/lib/db";

export default function QueryTesterPage() {
  return (
    <AppShell
      title="Local query tester"
      description="Run direct SQL against the local SQLite database for debugging, verification, or custom reporting."
    >
      <Surface
        title="SQLite console"
        description="Trusted-local use only. Direct SQL updates here can bypass the safer business workflows on the main pages."
      >
        <div className="mb-5 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-stone-700">
          Database file: <span className="font-mono text-xs">{databasePath}</span>
        </div>
        <QueryTester />
      </Surface>
    </AppShell>
  );
}
