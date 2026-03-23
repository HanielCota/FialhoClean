import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  RotateCcw,
  Shield,
  Wrench,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRepair } from "../../hooks/useRepair";
import type { RepairStatus } from "../../types/repair";
import { Header } from "../layout/Header";
import { Card } from "../shared/Card";
import { SectionHeading } from "../shared/SectionHeading";

function StatusBadge({ status }: { status: RepairStatus }) {
  const { t } = useTranslation();
  if (status === "idle") return null;
  if (status === "running") {
    return (
      <span className="flex items-center gap-1.5 font-medium text-[12px] text-accent">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent/40 border-t-accent" />
        {t("repair.status.running")}
      </span>
    );
  }
  if (status === "success") {
    return (
      <span className="flex items-center gap-1.5 font-medium text-[12px] text-green">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {t("repair.status.done")}
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

export function RepairView() {
  const { t } = useTranslation();
  const { sfc, dism, restorePoint, runSfc, runDism, createRestorePoint, resetTool } = useRepair();
  const [rpDescription, setRpDescription] = useState(() =>
    t("repair.restorePoint.defaultDescription"),
  );

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
                className={`mt-0.5 h-5 w-5 flex-shrink-0 ${restorePoint === "success" ? "text-green" : "text-text-muted"}`}
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
                  placeholder={t("repair.restorePoint.placeholder")}
                  className="mt-3 h-9 w-full rounded-[8px] border border-white/[0.07] bg-white/[0.04] px-3 text-[13px] text-text transition-colors placeholder:text-text-muted/50 focus:border-white/[0.15] focus:outline-none"
                />
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-2">
                <StatusBadge status={restorePoint} />
                <button
                  type="button"
                  onClick={() => void createRestorePoint(rpDescription)}
                  disabled={restorePoint === "running"}
                  className="focus-ring flex h-10 items-center gap-2 rounded-[10px] border border-accent/30 bg-accent/10 px-4 font-semibold text-[14px] text-accent transition-all duration-200 hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Shield className="h-4 w-4" />
                  {t("repair.restorePoint.button")}
                </button>
                {restorePoint !== "idle" && (
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
          <Card>
            <div className="flex items-start gap-4">
              <Wrench
                className={`mt-0.5 h-5 w-5 flex-shrink-0 ${sfc.status === "success" ? "text-green" : sfc.status === "error" ? "text-red" : "text-text-muted"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[15px] text-text">{t("repair.sfc.title")}</p>
                <p className="mt-1 text-[13px] text-text-muted">{t("repair.sfc.description")}</p>
                <div className="mt-2 flex items-center gap-2 text-[12px] text-text-muted/60">
                  <Clock className="h-3.5 w-3.5" />
                  {t("repair.sfc.duration")}
                </div>
                {sfc.result && <OutputPanel output={sfc.result.output} />}
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-2">
                <StatusBadge status={sfc.status} />
                {sfc.status !== "running" && (
                  <button
                    type="button"
                    onClick={() => void runSfc()}
                    className="focus-ring flex h-10 items-center gap-2 rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-4 font-semibold text-[14px] text-text-muted transition-all duration-200 hover:bg-white/[0.07] hover:text-text"
                  >
                    {sfc.status !== "idle" ? (
                      <>
                        <RotateCcw className="h-4 w-4" />
                        {t("repair.runAgain")}
                      </>
                    ) : (
                      <>
                        <Wrench className="h-4 w-4" />
                        {t("repair.sfc.button")}
                      </>
                    )}
                  </button>
                )}
                {sfc.status !== "idle" && (
                  <button
                    type="button"
                    onClick={() => resetTool("sfc")}
                    className="text-[11px] text-text-muted transition-colors hover:text-text"
                  >
                    {t("repair.reset")}
                  </button>
                )}
              </div>
            </div>
          </Card>
        </section>

        {/* DISM */}
        <section>
          <SectionHeading>{t("repair.sections.windowsImage")}</SectionHeading>
          <Card>
            <div className="flex items-start gap-4">
              <Wrench
                className={`mt-0.5 h-5 w-5 flex-shrink-0 ${dism.status === "success" ? "text-green" : dism.status === "error" ? "text-red" : "text-text-muted"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[15px] text-text">{t("repair.dism.title")}</p>
                <p className="mt-1 text-[13px] text-text-muted">{t("repair.dism.description")}</p>
                <div className="mt-2 flex items-center gap-2 text-[12px] text-text-muted/60">
                  <Clock className="h-3.5 w-3.5" />
                  {t("repair.dism.duration")}
                </div>
                {dism.result && <OutputPanel output={dism.result.output} />}
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-2">
                <StatusBadge status={dism.status} />
                {dism.status !== "running" && (
                  <button
                    type="button"
                    onClick={() => void runDism()}
                    className="focus-ring flex h-10 items-center gap-2 rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-4 font-semibold text-[14px] text-text-muted transition-all duration-200 hover:bg-white/[0.07] hover:text-text"
                  >
                    {dism.status !== "idle" ? (
                      <>
                        <RotateCcw className="h-4 w-4" />
                        {t("repair.runAgain")}
                      </>
                    ) : (
                      <>
                        <Wrench className="h-4 w-4" />
                        {t("repair.dism.button")}
                      </>
                    )}
                  </button>
                )}
                {dism.status !== "idle" && (
                  <button
                    type="button"
                    onClick={() => resetTool("dism")}
                    className="text-[11px] text-text-muted transition-colors hover:text-text"
                  >
                    {t("repair.reset")}
                  </button>
                )}
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
