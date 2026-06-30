import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-mint-50 text-mint-700">
      <Icon size={22} />
    </div>
    <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
    {description ? <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">{description}</p> : null}
    {actionLabel && onAction ? (
      <button className="btn-primary mt-5" type="button" onClick={onAction}>
        {actionLabel}
      </button>
    ) : null}
  </div>
);
