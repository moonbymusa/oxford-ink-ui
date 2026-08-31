import { useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  FileText,
  Loader2,
  RotateCcw,
  ScanLine,
  Smartphone,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { LanguageBadge, PaperStatusBadge, SourceBadge } from "@/components/badges";
import { useBatchUpload, usePaperQueue } from "@/lib/queries";
import { DEMO_EXAM_ID } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { TERMINAL_QUEUE_STATES, type PaperStatus } from "@/lib/types";

const MAX_BATCH_BYTES = 200 * 1024 * 1024;

/** Client-side batch item lifecycle mirrors PRD §1.3 paper states */
type BatchItem = {
  id: string;
  file: File;
  status: PaperStatus | "failed";
  progress: number;
};

export const Route = createFileRoute("/ingestion")({
  validateSearch: (search: Record<string, unknown>) => ({
    exam_id: typeof search["exam_id"] === "string" ? (search["exam_id"] as string) : DEMO_EXAM_ID,
  }),
  head: () => ({
    meta: [
      { title: "Answer Sheet Ingestion — ScriptGrade" },
      {
        name: "description",
        content:
          "Drag-and-drop batch scanner for handwritten answer sheets with live OCR progress, queue status pills, and retry triggers.",
      },
      { property: "og:title", content: "Answer Sheet Ingestion — ScriptGrade" },
      {
        property: "og:description",
        content: "Batch scan, queue, and track every student paper through the OCR pipeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IngestionPage,
});

function IngestionPage() {
  const { exam_id } = Route.useSearch();
  const navigate = useNavigate();
  const [items, setItems] = useState<BatchItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: queue } = usePaperQueue(exam_id);
  const upload = useBatchUpload(exam_id, setProgress);
  const papers = queue?.papers ?? [];

  const totalBytes = items.reduce((s, i) => s + i.file.size, 0);

  const stats = useMemo(() => {
    const done = papers.filter((p) => TERMINAL_QUEUE_STATES.includes(p.status)).length;
    return {
      total: papers.length,
      done,
      processing: papers.filter((p) => p.status === "ocr_in_progress").length,
      queued: papers.filter((p) => p.status === "queued" || p.status === "uploaded").length,
      pct: papers.length ? Math.round((done / papers.length) * 100) : 0,
    };
  }, [papers]);

  const accept = (incoming: FileList | null) => {
    if (!incoming?.length) return;
    const next: BatchItem[] = [
      ...items,
      ...Array.from(incoming).map((file, i) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${i}`,
        file,
        status: "uploaded" as const,
        progress: 0,
      })),
    ];
    if (next.reduce((s, i) => s + i.file.size, 0) > MAX_BATCH_BYTES) {
      toast.error("Batch too large", { description: "Keep each batch under 200 MB." });
      return;
    }
    setItems(next);
  };

  const patch = (id: string, data: Partial<BatchItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));

  /** Simulated per-file OCR progression so the queue stays observable offline. */
  const runItem = (item: BatchItem) => {
    patch(item.id, { status: "queued", progress: 0 });
    let pct = 0;
    const timer = setInterval(() => {
      pct = Math.min(100, pct + 8 + Math.round(Math.random() * 14));
      patch(item.id, {
        progress: pct,
        status: pct < 45 ? "queued" : pct < 100 ? "ocr_in_progress" : "evaluated",
      });
      if (pct >= 100) clearInterval(timer);
    }, 320);
  };

  const startBatch = () => {
    if (!items.length) {
      toast.error("Attach at least one answer sheet");
      return;
    }
    items.forEach(runItem);
    upload.mutate(items.map((i) => i.file));
  };

  return (
    <AppShell
      crumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Ingestion" }]}
      title="Answer Sheet Batch Scanner"
      actions={
        <button
          onClick={() => navigate({ to: "/diagnostic-studio", search: { exam_id } })}
          className="magnetic inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-bold text-primary-foreground"
        >
          Open Diagnostic Studio <ArrowRight size={15} />
        </button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              accept(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "glass flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-all",
              dragging ? "border-brand bg-brand/12 scale-[1.01]" : "border-border",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => accept(e.target.files)}
            />
            <div className="grid size-14 place-items-center rounded-2xl bg-gradient-brand">
              <UploadCloud size={24} className="text-primary-foreground" />
            </div>
            <p className="text-sm font-semibold">Drop scanned answer sheets here</p>
            <p className="mono-token text-xs text-muted-foreground">
              PDF · JPG · PNG — max 200 MB per batch — {items.length} file(s),{" "}
              {(totalBytes / 1024 / 1024).toFixed(1)} MB staged
            </p>
          </div>

          <button
            onClick={startBatch}
            disabled={upload.isPending}
            className="magnetic flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {upload.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <UploadCloud size={16} />
            )}
            {upload.isPending ? `Uploading… ${progress}%` : "Start Batch Ingestion"}
          </button>

          {upload.isPending && <Progress value={progress} className="h-2" />}

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Smartphone size={15} className="text-vision" />
              <p className="text-sm font-semibold">Mobile Scanner Channel</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Sheets captured in the ScriptGrade mobile app land in the same queue, tagged with a
              Mobile source pill.
            </p>
          </div>
        </div>

        {/* Batch file preview list */}
        <div className="glass overflow-hidden rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">Batch Preview</h2>
              <p className="mono-token text-[0.6875rem] text-muted-foreground">
                POST /papers/batch-upload · exam {exam_id}
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={() => setItems([])}
                className="mono-token rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-alert"
              >
                Clear all
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
              <FileText size={22} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No sheets staged yet.</p>
            </div>
          ) : (
            <div className="max-h-[420px] space-y-2 overflow-y-auto p-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-muted/25 p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <ScanLine size={13} className="text-brand-light" />
                    <span className="mono-token truncate">{item.file.name}</span>
                    <span className="ml-auto text-muted-foreground">
                      {(item.file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      aria-label={`Remove ${item.file.name}`}
                      onClick={() => setItems(items.filter((i) => i.id !== item.id))}
                      className="text-muted-foreground transition-colors hover:text-alert"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div className="mt-2.5 flex items-center gap-3">
                    {item.status === "failed" ? (
                      <span className="mono-token rounded-full border border-alert/45 bg-alert/12 px-2.5 py-1 text-[0.6875rem] font-semibold text-alert">
                        Failed
                      </span>
                    ) : (
                      <PaperStatusBadge status={item.status} />
                    )}
                    <Progress value={item.progress} className="h-1.5 flex-1" />
                    <span className="mono-token w-10 text-right text-[0.6875rem] text-muted-foreground">
                      {item.progress}%
                    </span>
                    {(item.status === "failed" || item.progress === 100) && (
                      <button
                        onClick={() => runItem(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[0.6875rem] text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground"
                      >
                        <RotateCcw size={11} /> Retry
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live grading queue */}
      <div className="glass mt-5 overflow-hidden rounded-2xl">
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">Live Grading Queue</h2>
              <p className="mono-token text-[0.6875rem] text-muted-foreground">
                polling GET /papers/queue every 3s · exam {exam_id}
              </p>
            </div>
            <span className="mono-token rounded-lg border border-pass/40 bg-pass/10 px-2.5 py-1 text-xs text-pass">
              {stats.done}/{stats.total} complete
            </span>
          </div>
          <Progress value={stats.pct} className="mt-3 h-2" />
          <div className="mono-token mt-2 flex gap-4 text-[0.6875rem] text-muted-foreground">
            <span>{stats.queued} queued</span>
            <span className="text-vision">{stats.processing} OCR active</span>
            <span className="text-pass">{stats.done} evaluated</span>
          </div>
        </div>

        <div className="max-h-[520px] overflow-y-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="sticky top-0 bg-card/95 text-xs text-muted-foreground backdrop-blur">
              <tr>
                <th className="px-5 py-3 font-semibold">Student</th>
                <th className="px-5 py-3 font-semibold">Source</th>
                <th className="px-5 py-3 font-semibold">Language</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Score</th>
                <th className="px-5 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {papers.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-accent/40">
                  <td className="mono-token px-5 py-3">{p.student_id}</td>
                  <td className="px-5 py-3">
                    <SourceBadge source={p.source} />
                  </td>
                  <td className="px-5 py-3">
                    <LanguageBadge language={p.language} />
                  </td>
                  <td className="px-5 py-3">
                    <PaperStatusBadge status={p.status} />
                  </td>
                  <td className="mono-token px-5 py-3 text-right">
                    {p.score === null ? "—" : `${p.score}/${p.max_score}`}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {p.status === "needs_review" ? (
                      <button
                        onClick={() =>
                          navigate({
                            to: "/diagnostic-studio",
                            search: { exam_id, student_id: p.student_id },
                          })
                        }
                        className="mono-token rounded-lg border border-warn/45 bg-warn/10 px-2.5 py-1 text-[0.6875rem] text-warn"
                      >
                        Review
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          toast.success("Re-queued for OCR", { description: p.student_id })
                        }
                        className="mono-token inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[0.6875rem] text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground"
                      >
                        <RotateCcw size={11} /> Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
