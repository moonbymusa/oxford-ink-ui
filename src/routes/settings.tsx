import { createFileRoute } from "@tanstack/react-router";
import { Ruler, ShieldCheck, SpellCheck2, Workflow } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Switch } from "@/components/ui/switch";
import { useRubricStore } from "@/stores/rubric";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Evaluation Settings — ScriptGrade" },
      {
        name: "description",
        content:
          "Configure default 8-debugger evaluation behaviour: fuzzy spelling correction, strict DAG ordering, and density scoring.",
      },
      { property: "og:title", content: "Evaluation Settings — ScriptGrade" },
      {
        property: "og:description",
        content: "Institution-wide defaults for the ScriptGrade grading engine.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { toggles, setToggle } = useRubricStore();

  const rows = [
    {
      key: "spelling_correction" as const,
      label: "Fuzzy spelling correction",
      hint: "Levenshtein ≥ 0.85 similarity is treated as a match.",
      Icon: SpellCheck2,
    },
    {
      key: "strict_dag_order" as const,
      label: "Strict DAG sequence order",
      hint: "Penalise answers where process steps appear out of order.",
      Icon: Workflow,
    },
    {
      key: "density_scoring" as const,
      label: "Density scoring",
      hint: "Flag padded answers with a low valid-keyword ratio.",
      Icon: Ruler,
    },
  ];

  return (
    <AppShell
      crumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Settings" }]}
      title="Evaluation Settings"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)]">
        <section className="glass rounded-2xl p-5">
          <h2 className="text-base font-semibold">Engine Defaults</h2>
          <p className="mono-token text-[0.6875rem] text-muted-foreground">
            applied to every new exam via PUT /exam/rubric
          </p>
          <div className="mt-4 space-y-3">
            {rows.map(({ key, label, hint, Icon }) => (
              <div
                key={key}
                className="flex items-center gap-3 rounded-xl border border-border bg-muted/25 p-4"
              >
                <Icon size={16} className="text-brand-light" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
                <Switch
                  checked={toggles[key]}
                  onCheckedChange={(v) => setToggle(key, v)}
                  aria-label={label}
                  className="ml-auto"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-pass" />
            <h2 className="text-base font-semibold">Audit & Access</h2>
          </div>
          <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
            <li>• Every teacher override is written to an immutable audit trail.</li>
            <li>• Role-based access: teacher, department head, exam controller.</li>
            <li>• JWT bearer sessions expire after 24 hours of inactivity.</li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
