import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  Clock,
  Download,
  FileSpreadsheet,
  Flag,
  MoreHorizontal,
  Plus,
  Target,
  Users,
  Wand2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/badges";
import { useExams } from "@/lib/queries";
import { scoreBands } from "@/lib/demo-data";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Exam Hub — ScriptGrade Dashboard" },
      {
        name: "description",
        content:
          "Monitor exams, grading accuracy, hours saved, and score distribution across every graded class in ScriptGrade.",
      },
      { property: "og:title", content: "Exam Hub — ScriptGrade Dashboard" },
      {
        property: "og:description",
        content: "Live exam pipeline, accuracy metrics, and score distribution analytics.",
      },
    ],
  }),
  component: DashboardPage,
});

function MetricCard({
  label,
  value,
  hint,
  Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  Icon: typeof Activity;
  tone: string;
}) {
  return (
    <div className="glass lift rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
        <div className={`grid size-9 place-items-center rounded-xl ${tone}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="mt-3 font-display text-[2rem] leading-none font-extrabold">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function DashboardPage() {
  const { data, isLoading } = useExams();
  const navigate = useNavigate();
  const metrics = data?.metrics;

  return (
    <AppShell
      crumbs={[{ label: "ScriptGrade", to: "/dashboard" }, { label: "Exam Hub" }]}
      title="Exam Hub"
      actions={
        <button
          onClick={() => navigate({ to: "/exam/setup" })}
          className="magnetic inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-bold text-primary-foreground"
        >
          <Plus size={16} /> Create &amp; Grade New Exam
        </button>
      }
    >
      {data?.demo && (
        <p className="mono-token mb-5 rounded-xl border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
          FastAPI backend unreachable at /api/v1 — rendering demo fixtures. Start the backend to load
          live data.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !metrics ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[142px] rounded-2xl" />)
        ) : (
          <>
            <MetricCard
              label="Total Exams"
              value={String(metrics.total_exams)}
              hint="Across all classes this session"
              Icon={FileSpreadsheet}
              tone="bg-brand/15 text-brand-light"
            />
            <MetricCard
              label="Grading Accuracy"
              value={`${metrics.accuracy_pct.toFixed(1)}%`}
              hint="Teacher-confirmed vs AI-scored"
              Icon={Target}
              tone="bg-pass/15 text-pass"
            />
            <MetricCard
              label="Hours Saved"
              value={`${metrics.hours_saved}h`}
              hint="At 0.35 min/paper manual baseline"
              Icon={Clock}
              tone="bg-vision/15 text-vision"
            />
            <MetricCard
              label="Flagged Papers"
              value="2"
              hint="Awaiting teacher moderation"
              Icon={Flag}
              tone="bg-warn/15 text-warn"
            />
          </>
        )}
      </div>

      {/* Recent exams table */}
      <div className="glass mt-6 overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Recent Exams</h2>
          <span className="mono-token text-[0.625rem] text-muted-foreground">
            GET /api/v1/exams/list
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Exam Name</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Class Size</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Class Avg</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      <td colSpan={6} className="px-5 py-4">
                        <Skeleton className="h-5 w-full shimmer" />
                      </td>
                    </tr>
                  ))
                : data?.exams.map((exam) => (
                    <tr key={exam.id} className="border-t border-border transition-colors hover:bg-accent/40">
                      <td className="px-5 py-3.5">
                        <Link
                          to="/diagnostic-studio"
                          search={{ exam_id: exam.id }}
                          className="font-medium text-foreground hover:text-brand-light"
                        >
                          {exam.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {new Date(exam.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Users size={13} /> {exam.paper_count}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={exam.status} />
                      </td>
                      <td className="mono-token px-5 py-3.5">
                        {exam.avg_score === null
                          ? "—"
                          : `${((exam.avg_score / exam.max_score) * 100).toFixed(1)}%`}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          aria-label={`Actions for ${exam.name}`}
                          className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="glass rounded-2xl p-5">
          <h2 className="text-base font-semibold">Score Distribution</h2>
          <p className="mb-4 text-xs text-muted-foreground">Students per score band · current cohort</p>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBands}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="band" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v) => [`${v} students`, "Count"]}
                />
                <Bar dataKey="count" fill="var(--brand)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="text-base font-semibold">Quick Actions</h2>
          <p className="mb-4 text-xs text-muted-foreground">Press ⌘K for the full command palette</p>
          <div className="space-y-2">
            {[
              { label: "Re-extract rubric with Qwen AI", to: "/exam/setup", Icon: Wand2 },
              { label: "Review flagged papers", to: "/diagnostic-studio", Icon: Flag },
              { label: "Download class report", to: "/analytics", Icon: Download },
            ].map(({ label, to, Icon }) => (
              <Link
                key={label}
                to={to}
                className="lift flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-medium"
              >
                <Icon size={15} className="text-brand-light" />
                {label}
                <ArrowUpRight size={14} className="ml-auto text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
