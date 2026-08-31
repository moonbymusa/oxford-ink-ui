import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, LifeBuoy, Terminal } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DEBUGGERS, toneClasses } from "@/components/debuggers/DebuggerPanel";
import { API_BASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & API Reference — ScriptGrade" },
      {
        name: "description",
        content:
          "How the ScriptGrade 8-debugger engine grades handwritten scripts, plus the REST endpoints the dashboard consumes.",
      },
      { property: "og:title", content: "Help & API Reference — ScriptGrade" },
      {
        property: "og:description",
        content: "Debugger reference and endpoint map for the ScriptGrade dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HelpPage,
});

const ENDPOINTS = [
  "POST /auth/login",
  "GET  /exams/list",
  "POST /exam/setup",
  "PUT  /exam/rubric",
  "POST /papers/batch-upload",
  "GET  /papers/queue?exam_id=",
  "GET  /papers/{student_id}",
  "POST /papers/{student_id}/override",
  "GET  /analytics/export?format=csv|pdf",
];

function HelpPage() {
  return (
    <AppShell
      crumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Help" }]}
      title="Help & API Reference"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-brand-light" />
            <h2 className="text-base font-semibold">The 8 Debuggers</h2>
          </div>
          <div className="mt-4 space-y-2">
            {DEBUGGERS.map(({ n, roman, label, tone, Icon }) => {
              const t = toneClasses[tone];
              return (
                <div
                  key={n}
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/25 px-4 py-3"
                >
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-lg border text-[0.625rem] font-bold",
                      t.border,
                      t.bg,
                      t.text,
                    )}
                  >
                    {roman}
                  </span>
                  <Icon size={14} className={t.text} />
                  <p className="text-sm font-semibold">{label}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-5">
          <section className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-vision" />
              <h2 className="text-base font-semibold">Endpoints</h2>
            </div>
            <p className="mono-token mt-1 text-[0.6875rem] text-muted-foreground">
              base {API_BASE_URL}
            </p>
            <ul className="mono-token mt-3 space-y-1.5 text-xs text-muted-foreground">
              {ENDPOINTS.map((e) => (
                <li key={e} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  {e}
                </li>
              ))}
            </ul>
          </section>

          <section className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <LifeBuoy size={16} className="text-pass" />
              <h2 className="text-base font-semibold">Offline demo mode</h2>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              When the grading backend is unreachable the dashboard falls back to PRD-shaped demo
              fixtures, so every screen stays explorable.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
