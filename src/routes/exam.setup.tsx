import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  FileText,
  Gauge,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  UploadCloud,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { examApi, isOffline } from "@/lib/api";
import { demoConcepts, DEMO_EXAM_ID } from "@/lib/demo-data";
import { newConcept, useRubricStore } from "@/stores/rubric";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import type { EvaluationToggles } from "@/lib/types";

export const Route = createFileRoute("/exam/setup")({
  head: () => ({
    meta: [
      { title: "AI Rubric Studio — ScriptGrade" },
      {
        name: "description",
        content:
          "Upload the question paper and model solution, then edit AI-extracted magic concepts, weightages, synonyms, and evaluation sensitivity toggles.",
      },
      { property: "og:title", content: "AI Rubric Studio — ScriptGrade" },
      {
        property: "og:description",
        content: "Qwen-extracted rubric concepts with interactive weightage editing.",
      },
    ],
  }),
  component: RubricStudio,
});

const STEPS = ["Upload", "AI Extraction", "Edit & Confirm", "Save & Ingest"] as const;

const TOGGLES: {
  key: keyof EvaluationToggles;
  title: string;
  sub: string;
  debug: string;
  Icon: typeof Gauge;
}[] = [
  {
    key: "spelling_correction",
    title: "Ignore Minor Spelling Mistakes",
    sub: "Levenshtein ≥ 85%",
    debug: "Debugger IV",
    Icon: Sparkles,
  },
  {
    key: "strict_dag_order",
    title: "Strict Procedural Order",
    sub: "DAG logic enforcement",
    debug: "Debugger V",
    Icon: Workflow,
  },
  {
    key: "density_scoring",
    title: "Anti-Fluff Density Scoring",
    sub: "Min density 30%",
    debug: "Debugger VII",
    Icon: Gauge,
  },
];

function RubricStudio() {
  const navigate = useNavigate();
  const {
    concepts,
    toggles,
    step,
    examId,
    setStep,
    setExam,
    hydrate,
    addConcept,
    removeConcept,
    updateConcept,
    setToggle,
  } = useRubricStore();

  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalPoints = concepts.reduce((sum, c) => sum + c.points, 0);

  const acceptFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    setQuestionFile(list[0] ?? null);
    if (list[1]) setAnswerFile(list[1]);
    setStep(1);
  };

  const handleExtract = async () => {
    if (!questionFile) {
      toast.error("Upload the question paper first");
      return;
    }
    setExtracting(true);
    setStep(2);
    const form = new FormData();
    form.append("question_file", questionFile);
    if (answerFile) form.append("answer_file", answerFile);
    try {
      const res = await examApi.setup(form);
      setExam(res.data.exam_id);
      hydrate(res.data.concepts);
      toast.success("Rubric extracted", {
        description: `${res.data.concepts.length} magic concepts identified by Qwen3.8-Max.`,
      });
    } catch (error) {
      if (isOffline(error)) {
        await new Promise((r) => setTimeout(r, 900));
        setExam(DEMO_EXAM_ID);
        hydrate(demoConcepts);
        toast.success("Rubric extracted (demo)", {
          description: "Backend offline — loaded reference photosynthesis rubric.",
        });
      }
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!concepts.length) {
      toast.error("Add at least one magic concept");
      return;
    }
    setSaving(true);
    const id = examId ?? DEMO_EXAM_ID;
    try {
      await examApi.saveRubric({ exam_id: id, concepts, toggles });
    } catch (error) {
      if (!isOffline(error)) {
        setSaving(false);
        return;
      }
    }
    setStep(4);
    setSaving(false);
    toast.success("Rubric saved", { description: "Proceeding to answer-sheet ingestion." });
    navigate({ to: "/ingestion", search: { exam_id: id } });
  };

  return (
    <AppShell
      crumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "New Exam Setup" }]}
      title="AI Rubric Studio"
    >
      {/* Stepper */}
      <div className="glass mb-6 flex flex-wrap items-center gap-3 rounded-2xl p-4">
        {STEPS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3 | 4;
          const done = step > n;
          const active = step === n;
          return (
            <div key={label} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
                  active
                    ? "border-brand bg-brand/18 text-foreground"
                    : done
                      ? "border-pass/40 bg-pass/10 text-pass"
                      : "border-border text-muted-foreground",
                )}
              >
                <span className="mono-token grid size-5 place-items-center rounded-md bg-background/40">
                  {done ? <Check size={11} /> : n}
                </span>
                {label}
              </div>
              {i < STEPS.length - 1 && <span className="h-px w-6 bg-border sm:w-10" />}
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Section A — upload */}
        <div className="space-y-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              acceptFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "glass flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-all",
              dragging ? "border-brand bg-brand/12 scale-[1.01]" : "border-border",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => acceptFiles(e.target.files)}
            />
            <div className="grid size-14 place-items-center rounded-2xl bg-gradient-brand">
              <UploadCloud size={24} className="text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">Drag &amp; drop Question Paper + Reference Answer</p>
              <p className="mt-1 text-xs text-muted-foreground">PDF · PNG · JPG — or click to browse</p>
            </div>
          </div>

          <div className="grid gap-2">
            {[
              { label: "Question Paper", file: questionFile, clear: () => setQuestionFile(null) },
              { label: "Model Solution", file: answerFile, clear: () => setAnswerFile(null) },
            ].map(({ label, file, clear }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm"
              >
                <FileText size={15} className={file ? "text-pass" : "text-muted-foreground"} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="mono-token truncate text-[0.6875rem] text-muted-foreground">
                    {file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : "not attached"}
                  </p>
                </div>
                {file && (
                  <button
                    aria-label={`Remove ${label}`}
                    onClick={clear}
                    className="ml-auto text-muted-foreground hover:text-alert"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleExtract}
            disabled={extracting}
            className="magnetic flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {extracting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {extracting ? "Qwen AI extracting rubric…" : "Auto-Extract with Qwen AI"}
          </button>

          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Sensitivity Toggles
            </p>
            <div className="mt-3 space-y-3">
              {TOGGLES.map(({ key, title, sub, debug, Icon }) => (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3"
                >
                  <Icon size={16} className="text-brand-light" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mono-token text-[0.6875rem] text-muted-foreground">
                      {sub} · {debug}
                    </p>
                  </div>
                  <Switch
                    checked={toggles[key]}
                    onCheckedChange={(v) => setToggle(key, v)}
                    aria-label={title}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section B — magic concepts */}
        <div className="space-y-5">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">AI-Extracted Magic Concepts</h2>
                <p className="text-xs text-muted-foreground">
                  Weightage editor · total {totalPoints} pts across {concepts.length} concepts
                </p>
              </div>
              <button
                onClick={() => addConcept(newConcept("New Concept", 1))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-brand/50 bg-brand/15 px-3 py-2 text-xs font-semibold text-brand-light"
              >
                <Plus size={13} /> Add Magic Word
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {extracting &&
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[58px] rounded-xl shimmer" />
                ))}

              {!extracting && concepts.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  No concepts yet — upload the paper and run Qwen extraction.
                </p>
              )}

              {concepts.map((c) => (
                <div key={c.id} className="rounded-xl border border-brand/30 bg-brand/8 p-3 spring-in">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pencil size={12} className="text-brand-light" />
                    <input
                      value={c.keyword}
                      onChange={(e) => updateConcept(c.id, { keyword: e.target.value })}
                      aria-label="Concept keyword"
                      className="min-w-[120px] flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold outline-none focus:border-brand"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={10}
                        value={c.points}
                        onChange={(e) => updateConcept(c.id, { points: Number(e.target.value) })}
                        aria-label={`${c.keyword} weightage`}
                        className="w-24 accent-[var(--brand)]"
                      />
                      <span className="mono-token w-12 text-center text-xs font-bold text-brand-light">
                        {c.points}pts
                      </span>
                    </div>
                    <button
                      onClick={() => removeConcept(c.id)}
                      aria-label={`Remove ${c.keyword}`}
                      className="text-muted-foreground hover:text-alert"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {c.synonyms.map((s) => (
                      <span
                        key={s}
                        className="mono-token rounded-md border border-pass/35 bg-pass/10 px-2 py-0.5 text-[0.625rem] text-pass"
                      >
                        {s}
                      </span>
                    ))}
                    <input
                      placeholder="+ synonym ⏎"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          updateConcept(c.id, {
                            synonyms: [...c.synonyms, e.currentTarget.value.trim()],
                          });
                          e.currentTarget.value = "";
                        }
                      }}
                      aria-label={`Add synonym for ${c.keyword}`}
                      className="mono-token w-28 rounded-md border border-border bg-input/40 px-2 py-0.5 text-[0.625rem] outline-none focus:border-brand"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="magnetic flex w-full items-center justify-center gap-2 rounded-xl border border-brand/50 bg-brand/20 py-3.5 text-sm font-bold disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            Save Rubric &amp; Proceed to Paper Upload <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
