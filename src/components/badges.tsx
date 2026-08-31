import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Loader2,
  Monitor,
  ScanLine,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LANGUAGE_LABELS,
  RTL_LANGUAGES,
  type ExamStatus,
  type LanguageCode,
  type PaperSource,
  type PaperStatus,
} from "@/lib/types";

const pill =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide";

/* ── Exam status (PRD §3, Page 2) ─────────────────────────────── */
const examStatusConfig: Record<
  ExamStatus,
  { label: string; className: string; Icon: typeof CheckCircle; spin?: boolean }
> = {
  completed: {
    label: "Completed",
    className: "border-pass/40 bg-pass/12 text-pass",
    Icon: CheckCircle,
  },
  processing: {
    label: "Processing",
    className: "border-brand/45 bg-brand/15 text-brand-light",
    Icon: Loader2,
    spin: true,
  },
  needs_review: {
    label: "Needs Review",
    className: "border-warn/40 bg-warn/12 text-warn",
    Icon: AlertTriangle,
  },
  draft: {
    label: "Draft",
    className: "border-border bg-muted text-muted-foreground",
    Icon: FileText,
  },
};

export function StatusBadge({ status }: { status: ExamStatus }) {
  const { label, className, Icon, spin } = examStatusConfig[status];
  return (
    <span role="status" className={cn(pill, className)}>
      <Icon size={12} className={spin ? "animate-spin" : undefined} />
      {label}
    </span>
  );
}

/* ── Paper lifecycle status (PRD §1.3) ────────────────────────── */
const paperStatusConfig: Record<
  PaperStatus,
  { label: string; className: string; Icon: typeof CheckCircle; spin?: boolean }
> = {
  uploaded: { label: "Uploaded", className: "border-border bg-muted text-muted-foreground", Icon: FileText },
  queued: { label: "Queued", className: "border-border bg-muted text-muted-foreground", Icon: Loader2 },
  ocr_in_progress: {
    label: "OCR Active",
    className: "border-vision/45 bg-vision/12 text-vision",
    Icon: ScanLine,
    spin: true,
  },
  flagged: { label: "Flagged", className: "border-alert/45 bg-alert/12 text-alert", Icon: AlertTriangle },
  evaluated: { label: "Evaluated", className: "border-pass/40 bg-pass/12 text-pass", Icon: CheckCircle },
  needs_review: {
    label: "Needs Review",
    className: "border-warn/40 bg-warn/12 text-warn",
    Icon: AlertTriangle,
  },
  scored: { label: "Scored", className: "border-pass/40 bg-pass/12 text-pass", Icon: CheckCircle },
  override_applied: {
    label: "Override Applied",
    className: "border-brand/45 bg-brand/15 text-brand-light",
    Icon: Sparkles,
  },
  finalized: { label: "Finalized", className: "border-pass/45 bg-pass/16 text-pass", Icon: CheckCircle },
  exported: { label: "Exported", className: "border-vision/45 bg-vision/12 text-vision", Icon: FileText },
};

export function PaperStatusBadge({ status }: { status: PaperStatus }) {
  const { label, className, Icon, spin } = paperStatusConfig[status];
  return (
    <span role="status" className={cn(pill, className)}>
      <Icon size={12} className={spin ? "animate-spin" : undefined} />
      {label}
    </span>
  );
}

/* ── Source tag (PRD §3, Page 4) ──────────────────────────────── */
export function SourceBadge({ source }: { source: PaperSource }) {
  return source === "mobile" ? (
    <span className={cn(pill, "border-brand-light/40 bg-brand-light/12 text-brand-light")}>
      <Smartphone size={10} /> Mobile
    </span>
  ) : (
    <span className={cn(pill, "border-vision/40 bg-vision/12 text-vision")}>
      <Monitor size={10} /> Web
    </span>
  );
}

/* ── Language detector badge (English + RTL scripts) ──────────── */
export function LanguageBadge({ language }: { language: LanguageCode }) {
  const isRTL = RTL_LANGUAGES.includes(language);
  return (
    <span
      lang={language}
      dir={isRTL ? "rtl" : "ltr"}
      className={cn(
        pill,
        isRTL
          ? "border-warn/40 bg-warn/12 text-warn"
          : "border-pass/35 bg-pass/10 text-pass",
      )}
    >
      {LANGUAGE_LABELS[language]}
      {isRTL && <span className="text-[0.625rem] opacity-70">RTL</span>}
    </span>
  );
}
