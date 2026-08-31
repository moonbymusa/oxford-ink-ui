import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  FileUp,
  LayoutDashboard,
  LifeBuoy,
  ScanEye,
  Settings,
  Wand2,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to a workspace, exam, or action…" />
      <CommandList>
        <CommandEmpty>No matching command.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard /> Exam Hub Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/exam/setup")}>
            <Wand2 /> AI Rubric Studio
          </CommandItem>
          <CommandItem onSelect={() => go("/ingestion")}>
            <FileUp /> Dual Upload &amp; Scan Portal
          </CommandItem>
          <CommandItem onSelect={() => go("/diagnostic-studio")}>
            <ScanEye /> Master Grading Workspace
          </CommandItem>
          <CommandItem onSelect={() => go("/analytics")}>
            <BarChart3 /> Analytics &amp; Grade Insights
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => go("/exam/setup")}>
            <Wand2 /> Re-extract rubric with Qwen AI
          </CommandItem>
          <CommandItem onSelect={() => go("/diagnostic-studio")}>
            <ScanEye /> Review flagged papers
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <Settings /> Settings &amp; evaluation defaults
          </CommandItem>
          <CommandItem onSelect={() => go("/help")}>
            <LifeBuoy /> Help &amp; API reference
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
