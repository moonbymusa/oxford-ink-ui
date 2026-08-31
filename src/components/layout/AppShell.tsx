import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  ChevronRight,
  Command as CommandIcon,
  FileUp,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ScanEye,
  Settings,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { CommandPalette } from "./CommandPalette";

const NAV = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/exam/setup", label: "Rubric Studio", Icon: Wand2 },
  { to: "/ingestion", label: "Ingestion", Icon: FileUp },
  { to: "/diagnostic-studio", label: "Diagnostic Studio", Icon: ScanEye },
  { to: "/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/settings", label: "Settings", Icon: Settings },
  { to: "/help", label: "Help", Icon: LifeBuoy },
];

export interface Crumb {
  label: string;
  to?: string;
}

export function AppShell({
  children,
  crumbs = [],
  title,
  actions,
  padded = true,
}: {
  children: ReactNode;
  crumbs?: Crumb[];
  title?: string;
  actions?: ReactNode;
  padded?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { teacher, token, clearToken } = useAuthStore();

  // Role-based access gate — unauthenticated sessions bounce to /login
  useEffect(() => {
    if (!token) navigate({ to: "/login" });
  }, [token, navigate]);

  const role = teacher?.role ?? "teacher";
  const roleLabel = role
    .split("_")
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="flex min-h-screen">
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar backdrop-blur-xl transition-[width] duration-300 md:flex",
          collapsed ? "w-[76px]" : "w-[248px]",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 px-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-brand shadow-[var(--shadow-brand)]">
            <ScanEye size={18} className="text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-extrabold tracking-tight">
                ScriptGrade
              </p>
              <p className="mono-token truncate text-[0.625rem] text-muted-foreground">
                8-DEBUGGER ENGINE
              </p>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2.5 py-3">
          {NAV.map(({ to, label, Icon }) => {
            const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-brand/18 text-foreground shadow-[inset_0_0_0_1px_var(--brand)]"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <Icon size={17} className={active ? "text-brand-light" : undefined} />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="px-2.5 pb-4">
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl md:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 md:hidden" aria-label="ScriptGrade home">
            <div className="grid size-8 place-items-center rounded-lg bg-gradient-brand">
              <ScanEye size={16} className="text-primary-foreground" />
            </div>
          </Link>

          <span className="hidden items-center gap-1.5 rounded-full border border-vision/40 bg-vision/10 px-2.5 py-1 text-[0.6875rem] font-semibold text-vision sm:inline-flex">
            <Sparkles size={11} /> Qwen3.8-Max Powered
          </span>

          <button
            onClick={() => setPaletteOpen(true)}
            className="ml-auto hidden items-center gap-2 rounded-xl border border-border bg-input/40 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground sm:flex"
          >
            <CommandIcon size={13} /> Quick actions
            <kbd className="mono-token rounded-md border border-border px-1.5 py-0.5 text-[0.625rem]">
              ⌘K
            </kbd>
          </button>

          <button
            aria-label="Notifications"
            className="relative ml-auto grid size-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground sm:ml-0"
          >
            <Bell size={16} />
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-alert" />
          </button>

          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-2.5 py-1.5">
            <div className="grid size-7 place-items-center rounded-lg bg-gradient-brand text-[0.625rem] font-bold text-primary-foreground">
              {(teacher?.name ?? "SG")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="hidden leading-tight lg:block">
              <p className="max-w-[130px] truncate text-xs font-semibold">
                {teacher?.name ?? "Guest"}
              </p>
              <p className="flex items-center gap-1 text-[0.625rem] text-pass">
                <ShieldCheck size={9} /> {roleLabel}
              </p>
            </div>
            <button
              aria-label="Sign out"
              onClick={() => {
                clearToken();
                navigate({ to: "/login" });
              }}
              className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-alert"
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        {(crumbs.length > 0 || title || actions) && (
          <div className="flex flex-wrap items-end justify-between gap-4 px-4 pt-6 md:px-6">
            <div>
              {crumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {crumbs.map((c, i) => (
                    <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                      {i > 0 && <ChevronRight size={12} className="opacity-50" />}
                      {c.to ? (
                        <Link to={c.to} className="transition-colors hover:text-foreground">
                          {c.label}
                        </Link>
                      ) : (
                        <span className="text-foreground">{c.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
              )}
              {title && (
                <h1 className="mt-2 font-display text-2xl font-bold tracking-tight md:text-[1.75rem]">
                  {title}
                </h1>
              )}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
        )}

        <main className={cn("flex-1", padded && "px-4 py-6 md:px-6")}>{children}</main>
      </div>
    </div>
  );
}
