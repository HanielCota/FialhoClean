import type { ComponentType } from "react";
import { useId } from "react";
import { Card } from "./Card";
import { Toggle } from "./Toggle";

interface ToggleSettingProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleSetting({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: ToggleSettingProps) {
  const labelId = useId();

  if (!onChange) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-start gap-4">
        {Icon ? <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-text-muted" /> : null}
        <div className="min-w-0 flex-1">
          <p id={labelId} className="font-semibold text-[15px] text-text">
            {title}
          </p>
          <p className="mt-1 text-[13px] text-text-muted">{description}</p>
        </div>
        <div className="mt-0.5 flex-shrink-0">
          <Toggle checked={checked} onChange={onChange} aria-labelledby={labelId} />
        </div>
      </div>
    </Card>
  );
}
