import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  RotateCcw,
  Shield,
  Wrench,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type RepairToolState, formatElapsed, useRepair } from "../../hooks/useRepair";
import type { RepairStatus } from "../../types/repair";
import { Header } from "../layout/Header";
import { Card } from "../shared/Card";
import { SectionHeading } from "../shared/SectionHeading";

// ── Progress bar (indeterminate) ────────────────────────────────────────────

function IndeterminateProgress() {
  return (
    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div className="h-full w-1/3 animate-indeterminate rounded-full bg-accent/70" />
    </div>
  );
}

// ── Status badge with elapsed time ──────────────────────────────────────────

function StatusBadge({
  status,
  elapsedSeconds,
}: {
  status: RepairStatus;
  elapsedSeconds?: number;
}) {
  const { t } = useTranslation();

  if (status === "idle") return null;

  if (status === "running") {
    const time = elapsedSeconds != null && elapsedSeconds > 0 ? formatElapsed(elapsedSeconds) : "";
    return (
      <span className="flex items-center gap-1.5 font-medium text-[12px] text-accent">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {time
          ? t("repair.status.runningElapsed", { time })
          : t("repair.status.running")}
      </span>
    );
  }

  if (status === "success") {
    const time = elapsedSeconds != null && elapsedSeconds > 0 ? formatElapsed(elapsedSeconds) : "";
    return (
      <span className="flex items-center gap-1.5 font-medium text-[12px] text-green">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {time
          ? t("repair.status.doneElapsed", { time })
          : t("repair.status.done")}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 font-medium text-[12px] text-red">
      <XCircle className="h-3.5 w-3.5" />
      {t("repair.status.failed")}
    </span>
  );
}

// ── Output panel ────────────────────────────────────────────────────────────

function OutputPanel({ output }: { output: string }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  if (!output) return null;
  const lines = output.split("\n").filter(Boolean);
  const preview = lines.slice(0, 4).join("\n");
  const hasMore = lines.length > 4;

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-white/[0.06] bg-black/30">
      <pre className="whitespace-pre-wrap break-words p-3 font-mono text-[11px] text-text-muted leading-relaxed">
        {expanded ? output : preview}
        {!expanded && hasMore && "\n…"}
      </pre>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1 border-white/[0.06] border-t py-1.5 text-[11px] text-text-muted transition-colors hover:text-text"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> {t("repair.output.showLess")}
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />{" "}
              {t("repair.output.showFull", { count: lines.length })}
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ── Tool card (reusable for SFC and DISM) ───────────────────────────────────

function ToolCard({
  icon: Icon,
  title,
  description,
  duration,
  buttonLabel,
  runAgainLabel,
  tool,
  onRun,
  onReset,
}: {
  icon: typeof Wrench;
  title: string;
  description: string;
  duration: string;
  buttonLabel: string;
  runAgainLabel: string;
  tool: RepairToolState;
  onRun: () => void;
  onReset: () => void;
}) {
  const isRunning = tool.status === "running";
  const isDone = tool.status !== "idle";

  return (
    <Card>
      <div className="flex items-start gap-4">
        <Icon
          className={`mt-0.5 h-5 w-5 flex-shrink-0 transition-colors duration-300 ${
            tool.status === "success"
              ? "text-green"
              : tool.status === "error"
                ? "text-red"
                : isRunning
                  ? "text-accent"
                  : "text-text-muted"
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[15px] text-text">{title}</p>
          <p className="mt-1 text-[13px] text-text-muted">{description}</p>
          <div className="mt-2 flex items-center gap-2 text-[12px] text-text-muted/60">
            <Clock className="h-3.5 w-3.5" />
            {duration}
          </div>

          {isRunning && <IndeterminateProgress />}

          {tool.result && <OutputPanel output={tool.result.output} />}
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          <StatusBadge status={tool.status} elapsedSeconds={tool.elapsedSeconds} />

          <button
            type="button"
            onClick={onRun}
            disabled={isRunning}
            className="focus-ring flex h-10 items-center gap-2 rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-4 font-semibold text-[14px] text-text-muted transition-all duration-200 hover:bg-white/[0.07] hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {buttonLabel}
              </>
            ) : isDone ? (
              <>
                <RotateCcw className="h-4 w-4" />
                {runAgainLabel}
              </>
            ) : (
              <>
                <Icon className="h-4 w-4" />
                {buttonLabel}
              </>
            )}
          </button>

          {isDone && !isRunning && (
            <button
              type="button"
              onClick={onReset}
              className="text-[11px] text-text-muted transition-colors hover:text-text"
            >
              {/* Reset handled by parent */}
              Reset
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── Main view ───────────────────────────────────────────────────────────────

export function RepairView() {
  const { t } = useTranslation();
  const { sfc, dism, restorePoint, rpElapsed, runSfc, runDism, createRestorePoint, resetTool } =
    useRepair();
  const [rpDescription, setRpDescription] = useState(() =>
    t("repair.restorePoint.defaultDescription"),
  );

  const rpIsRunning = restorePoint === "running";

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 px-6 pt-6 xl:px-8 xl:pt-8">
        <Header title={t("repair.title")} subtitle={t("repair.subtitle")} />
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-white/[0.03] p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
          <p className="text-[13px] text-text-muted">{t("repair.adminWarning")}</p>
        </div>
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto px-6 py-4 xl:px-8">
        {/* Restore Point */}
        <section>
          <SectionHeading>{t("repair.sections.restorePoint")}</SectionHeading>
          <Card>
            <div className="flex items-start gap-4">
              <Shield
                className={`mt-0.5 h-5 w-5 flex-shrink-0 transition-colors duration-300 ${
                  restorePoint === "success"
                    ? "text-green"
                    : restorePoint === "error"
                      ? "text-red"
                      : rpIsRunning
                        ? "text-accent"
                        : "text-text-muted"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[15px] text-text">
                  {t("repair.restorePoint.title")}
                </p>
                <p className="mt-1 text-[13px] text-text-muted">
                  {t("repair.restorePoint.description")}
                </p>
                <input
                  type="text"
                  value={rpDescription}
                  onChange={(e) => setRpDescription(e.target.value)}
                  disabled={rpIsRunning}
                  placeholder={t("repair.restorePoint.placeholder")}
                  className="mt-3 h-9 w-full rounded-[8px] border border-white/[0.07] bg-white/[0.04] px-3 text-[13px] text-text transition-colors placeholder:text-text-muted/50 focus:border-white/[0.15] focus:outline-none disabled:opacity-50"
                />

                {rpIsRunning && <IndeterminateProgress />}
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-2">
                <StatusBadge status={restorePoint} elapsedSeconds={rpElapsed} />
                <button
                  type="button"
                  onClick={() => void createRestorePoint(rpDescription)}
                  disabled={rpIsRunning}
                  className="focus-ring flex h-10 items-center gap-2 rounded-[10px] border border-accent/30 bg-accent/10 px-4 font-semibold text-[14px] text-accent transition-all duration-200 hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {rpIsRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  {t("repair.restorePoint.button")}
                </button>
                {restorePoint !== "idle" && !rpIsRunning && (
                  <button
                    type="button"
                    onClick={() => resetTool("restore_point")}
                    className="text-[11px] text-text-muted transition-colors hover:text-text"
                  >
                    {t("repair.reset")}
                  </button>
                )}
              </div>
            </div>
          </Card>
        </section>

        {/* System File Checker */}
        <section>
          <SectionHeading>{t("repair.sections.systemFiles")}</SectionHeading>
          <ToolCard
            icon={Wrench}
            title={t("repair.sfc.title")}
            description={t("repair.sfc.description")}
            duration={t("repair.sfc.duration")}
            buttonLabel={t("repair.sfc.button")}
            runAgainLabel={t("repair.runAgain")}
            tool={sfc}
            onRun={runSfc}
            onReset={() => resetTool("sfc")}
          />
        </section>

        {/* DISM */}
        <section>
          <SectionHeading>{t("repair.sections.windowsImage")}</SectionHeading>
          <ToolCard
            icon={Wrench}
            title={t("repair.dism.title")}
            description={t("repair.dism.description")}
            duration={t("repair.dism.duration")}
            buttonLabel={t("repair.dism.button")}
            runAgainLabel={t("repair.runAgain")}
            tool={dism}
            onRun={runDism}
            onReset={() => resetTool("dism")}
          />
        </section>
      </div>
    </div>
  );
}
