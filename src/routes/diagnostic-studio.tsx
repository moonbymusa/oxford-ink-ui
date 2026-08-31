import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileWarning, Image as ImageIcon, Loader2, Save, ScanEye, ScanText } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LanguageBadge, PaperStatusBadge, SourceBadge } from "@/components/badges";
import {
  DEBUGGERS,
  DebuggerTabContent,
  toneClasses,
} from "@/components/debuggers/DebuggerPanel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { usePaper, usePaperQueue, useOverride } from "@/lib/queries";
import { DEMO_EXAM_ID } from "@/lib/demo-data";
import { LANGUAGE_LABELS, RTL_LANGUAGES, type LanguageCode } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/diagnostic-studio")({
  validateSearch: (search: Record<string, unknown>): { exam_id: string; student_id?: string } => ({
    exam_id: typeof search["exam_id"] === "string" ? (search["exam_id"] as string) : DEMO_EXAM_ID,
    ...(typeof search["student_id"] === "string"
      ? { student_id: search["student_id"] as string }
      : {}),
  }),
  head: () => ({
    meta: [
      { title: "Diagnostic Studio — 8-Debugger Engine | ScriptGrade" },
      {
        name: "description",
        content:
          "Split-pane grading workspace: scanned student paper beside all eight debugger result cards, with a teacher score override slider.",
      },
      { property: "og:title", content: "Diagnostic Studio — 8-Debugger Engine" },
      {
        property: "og:description",
        content:
          "Garbage classifier, negation, synonym, fuzzy spelling, sequence DAG, vision, density, and rubric aggregation — fully transparent.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiagnosticStudio,
});

const LANGS: LanguageCode[] = ["en", "ur", "sd", "pa"];

function DiagnosticStudio() {
  const { exam_id, student_id } = Route.useSearch();
  const { data: queue } = usePaperQueue(exam_id);
  const papers = useMemo(() => queue?.papers ?? [], [queue]);

  const [active, setActive] = useState<string | null>(student_id ?? null);
  useEffect(() => {
    if (!active && papers.length) setActive(papers[0]!.student_id);
  }, [active, papers]);

  const { data: paper, isLoading } = usePaper(active);
  const override = useOverride(active ?? "", exam_id);

  const [score, setScore] = useState<number | null>(null);
  const [note, setNote] = useState("");
  useEffect(() => {
    if (paper) {
      setScore(paper.score);
      setNote("");
    }
  }, [paper]);

  const isRTL = paper ? RTL_LANGUAGES.includes(paper.language) : false;

  return (
    <AppShell
      padded={false}
      crumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Diagnostic Studio" }]}
      title="Diagnostic Studio"
      actions={
        <div className="flex flex-wrap items-center gap-1.5">
          {LANGS.map((l) => (
            <span
              key={l}
              className={cn(
                "transition-opacity",
                paper?.language === l ? "opacity-100" : "opacity-45",
              )}
            >
              <LanguageBadge language={l} />
            </span>
          ))}
        </div>
      }
    >
      <div className="px-4 pt-4 md:px-6">
        {/* Paper selector */}
        <div className="glass mb-4 flex gap-2 overflow-x-auto rounded-2xl p-3">
          {papers.slice(0, 24).map((p) => (
            <button
              key={p.id}
              onClick={() => setActive(p.student_id)}
              className={cn(
                "mono-token shrink-0 rounded-xl border px-3 py-2 text-xs transition-all",
                p.student_id === active
                  ? "border-brand bg-brand/15 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {p.student_id}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !paper ? (
        <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Loading debugger payload…
        </div>
      ) : (
        <ResizablePanelGroup className="min-h-[70vh] items-stretch border-t border-border">
          {/* ── Left: scanned paper ─────────────────────────── */}
          <ResizablePanel defaultSize={42} minSize={26}>
            <div className="space-y-4 p-4 md:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono-token text-sm font-semibold">{paper.student_id}</span>
                <PaperStatusBadge status={paper.status} />
                <SourceBadge source={paper.source} />
                <LanguageBadge language={paper.language} />
              </div>

              <div className="glass overflow-hidden rounded-2xl">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs text-muted-foreground">
                  <ImageIcon size={13} className="text-vision" /> Scanned Sheet
                  <span className="mono-token ml-auto">
                    OCR confidence {paper.ocr_confidence.toFixed(1)}%
                  </span>
                </div>
                {paper.scan_url ? (
                  <img
                    src={paper.scan_url}
                    alt={`Scanned answer sheet for ${paper.student_id}`}
                    className="w-full"
                  />
                ) : (
                  <div className="relative aspect-[3/4] w-full bg-muted/30">
                    <div className="absolute inset-0 grid place-items-center text-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <FileWarning size={20} />
                        Scan preview unavailable offline — OCR transcript shown below.
                      </div>
                    </div>
                    {paper.debuggers.vision.detected_elements.map((el) => {
                      const { image_width: w, image_height: h } = paper.debuggers.vision;
                      const [x1, y1, x2, y2] = el.bbox;
                      return (
                        <div
                          key={el.label}
                          title={`${el.label} — ${el.confidence}%`}
                          className="absolute rounded-md border border-vision/70 bg-vision/10"
                          style={{
                            left: `${(x1 / w) * 100}%`,
                            top: `${(y1 / h) * 100}%`,
                            width: `${((x2 - x1) / w) * 100}%`,
                            height: `${((y2 - y1) / h) * 100}%`,
                          }}
                        >
                          <span className="mono-token absolute -top-4 left-0 text-[0.5625rem] text-vision">
                            {el.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ScanText size={13} className="text-brand-light" /> OCR Transcript ·{" "}
                  {LANGUAGE_LABELS[paper.language]}
                </div>
                <p
                  dir={isRTL ? "rtl" : "ltr"}
                  lang={paper.language}
                  className={cn(
                    "mt-3 text-sm leading-relaxed",
                    isRTL && "text-right leading-loose",
                  )}
                >
                  {paper.ocr_text}
                </p>
                <div className="mono-token mt-3 flex gap-4 border-t border-border pt-3 text-[0.6875rem] text-muted-foreground">
                  <span>{paper.word_count} words</span>
                  <span>density {paper.density_ratio}%</span>
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* ── Right: 8-debugger cards ─────────────────────── */}
          <ResizablePanel defaultSize={58} minSize={34}>
            <div className="space-y-4 p-4 md:p-6">
              <div className="flex items-center gap-2">
                <ScanEye size={16} className="text-brand-light" />
                <h2 className="font-display text-lg font-bold">Musa's 8-Debugger Engine</h2>
                <span className="mono-token ml-auto rounded-lg border border-pass/40 bg-pass/10 px-2.5 py-1 text-xs text-pass">
                  {paper.debuggers.aggregator.total_awarded}/
                  {paper.debuggers.aggregator.total_max} pts
                </span>
              </div>

              <div className="grid gap-4 2xl:grid-cols-2">
                {DEBUGGERS.map(({ n, roman, label, tone, Icon }) => {
                  const t = toneClasses[tone];
                  return (
                    <section key={n} className="glass rounded-2xl p-4">
                      <header className="mb-3 flex items-center gap-2">
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
                        <h3 className="text-sm font-semibold">{label}</h3>
                      </header>
                      <DebuggerTabContent tab={n} paper={paper} />
                    </section>
                  );
                })}
              </div>

              {/* Teacher override */}
              <section className="glass rounded-2xl p-5">
                <h3 className="text-sm font-semibold">Teacher Score Override</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Human-in-the-loop moderation — every override is written to the audit trail.
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <Slider
                    value={[score ?? 0]}
                    min={0}
                    max={paper.max_score}
                    step={0.5}
                    onValueChange={(v) => setScore(v[0] ?? 0)}
                    aria-label="Override score"
                    className="flex-1"
                  />
                  <span className="mono-token w-20 text-right text-lg font-bold text-brand-light">
                    {(score ?? 0).toFixed(1)}/{paper.max_score}
                  </span>
                </div>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Moderation note (required for audit trail)…"
                  className="mt-4"
                />
                <button
                  onClick={() =>
                    override.mutate({
                      override_score: score ?? 0,
                      moderation_note: note || "Teacher override applied from Diagnostic Studio.",
                    })
                  }
                  disabled={override.isPending}
                  className="magnetic mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
                >
                  {override.isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  Apply Override
                </button>
              </section>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </AppShell>
  );
}
