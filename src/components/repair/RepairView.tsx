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
  if (status === "idle") return null;
  if (status === "running") {
    return (
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-accent">
        <span className="w-3.5 h-3.5 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
        Running…
      </span>
    );
  }
  if (status === "success") {
    return (
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-green">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Done
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-[12px] font-medium text-red">
      <XCircle className="w-3.5 h-3.5" />
      Failed
    </span>
  );
}

function OutputPanel({ output }: { output: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!output) return null;
  const lines = output.split("\n").filter(Boolean);
  const preview = lines.slice(0, 4).join("\n");
  const hasMore = lines.length > 4;

  return (
    <div className="mt-3 rounded-lg bg-black/30 border border-white/[0.06] overflow-hidden">
      <pre className="p-3 text-[11px] text-text-muted font-mono leading-relaxed whitespace-pre-wrap break-words">
        {expanded ? output : preview}
        {!expanded && hasMore && "\n…"}
      </pre>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-1 py-1.5 border-t border-white/[0.06] text-[11px] text-text-muted hover:text-text transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="w-3 h-3" /> Show less</>
          ) : (
            <><ChevronDown className="w-3 h-3" /> Show full output ({lines.length} lines)</>
          )}
        </button>
      )}
    </div>
  );
}

export function RepairView() {
  const { t } = useTranslation();
  const { sfc, dism, restorePoint, runSfc, runDism, createRestorePoint, resetTool } = useRepair();
  const [rpDescription, setRpDescription] = useState("FialhoClean Backup");

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 xl:px-8 pt-6 xl:pt-8 flex-shrink-0">
        <Header
          title={t("repair.title")}
          subtitle={t("repair.subtitle")}
        />
        <div className="mb-4 flex items-start gap-3 p-4 bg-white/[0.03] border border-amber-400/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-text-muted">
            {t("repair.adminWarning")}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 xl:px-8 py-4 space-y-7">

        {/* Restore Point */}
        <section>
          <SectionHeading>{t("repair.sections.restorePoint")}</SectionHeading>
          <Card>
            <div className="flex items-start gap-4">
              <Shield className={`w-5 h-5 flex-shrink-0 mt-0.5 ${restorePoint === "success" ? "text-green" : "text-text-muted"}`} />
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-text">{t("repair.restorePoint.title")}</p>
                <p className="text-[13px] text-text-muted mt-1">{t("repair.restorePoint.description")}</p>
                <input
                  type="text"
                  value={rpDescription}
                  onChange={(e) => setRpDescription(e.target.value)}
                  placeholder={t("repair.restorePoint.placeholder")}
                  className="mt-3 w-full h-9 rounded-[8px] border border-white/[0.07] bg-white/[0.04] px-3 text-[13px] text-text placeholder:text-text-muted/50 focus:outline-none focus:border-white/[0.15] transition-colors"
                />
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <StatusBadge status={restorePoint} />
                <button
                  type="button"
                  onClick={() => void createRestorePoint(rpDescription)}
                  disabled={restorePoint === "running"}
                  className="focus-ring flex items-center gap-2 rounded-[10px] border border-accent/30 bg-accent/10 px-4 h-10 text-[14px] font-semibold text-accent hover:bg-accent/15 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Shield className="w-4 h-4" />
                  {t("repair.restorePoint.button")}
                </button>
                {restorePoint !== "idle" && (
                  <button
                    type="button"
                    onClick={() => resetTool("restore_point")}
                    className="text-[11px] text-text-muted hover:text-text transition-colors"
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
              <Wrench className={`w-5 h-5 flex-shrink-0 mt-0.5 ${sfc.status === "success" ? "text-green" : sfc.status === "error" ? "text-red" : "text-text-muted"}`} />
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-text">{t("repair.sfc.title")}</p>
                <p className="text-[13px] text-text-muted mt-1">{t("repair.sfc.description")}</p>
                <div className="flex items-center gap-2 mt-2 text-[12px] text-text-muted/60">
                  <Clock className="w-3.5 h-3.5" />
                  {t("repair.sfc.duration")}
                </div>
                {sfc.result && <OutputPanel output={sfc.result.output} />}
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <StatusBadge status={sfc.status} />
                {sfc.status !== "running" && (
                  <button
                    type="button"
                    onClick={() => void runSfc()}
                    className="focus-ring flex items-center gap-2 rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-4 h-10 text-[14px] font-semibold text-text-muted hover:text-text hover:bg-white/[0.07] transition-all duration-200"
                  >
                    {sfc.status !== "idle" ? <><RotateCcw className="w-4 h-4" />{t("repair.runAgain")}</> : <><Wrench className="w-4 h-4" />{t("repair.sfc.button")}</>}
                  </button>
                )}
                {sfc.status !== "idle" && (
                  <button type="button" onClick={() => resetTool("sfc")} className="text-[11px] text-text-muted hover:text-text transition-colors">
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
              <Wrench className={`w-5 h-5 flex-shrink-0 mt-0.5 ${dism.status === "success" ? "text-green" : dism.status === "error" ? "text-red" : "text-text-muted"}`} />
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-text">{t("repair.dism.title")}</p>
                <p className="text-[13px] text-text-muted mt-1">{t("repair.dism.description")}</p>
                <div className="flex items-center gap-2 mt-2 text-[12px] text-text-muted/60">
                  <Clock className="w-3.5 h-3.5" />
                  {t("repair.dism.duration")}
                </div>
                {dism.result && <OutputPanel output={dism.result.output} />}
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <StatusBadge status={dism.status} />
                {dism.status !== "running" && (
                  <button
                    type="button"
                    onClick={() => void runDism()}
                    className="focus-ring flex items-center gap-2 rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-4 h-10 text-[14px] font-semibold text-text-muted hover:text-text hover:bg-white/[0.07] transition-all duration-200"
                  >
                    {dism.status !== "idle" ? <><RotateCcw className="w-4 h-4" />{t("repair.runAgain")}</> : <><Wrench className="w-4 h-4" />{t("repair.dism.button")}</>}
                  </button>
                )}
                {dism.status !== "idle" && (
                  <button type="button" onClick={() => resetTool("dism")} className="text-[11px] text-text-muted hover:text-text transition-colors">
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
