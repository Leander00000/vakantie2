interface StatusBadgeProps {
  status: string;
}

const toneForStatus = (status: string) => {
  const normalized = status.toLowerCase();

  if (["betaald", "definitief", "gepland", "ingepakt"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (["geboekt", "concept", "optie gevonden"].includes(normalized)) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (["nog zoeken", "nog te betalen", "openstaand"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (["waarschuwing", "ontbreekt"].includes(normalized)) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
};

export const StatusBadge = ({ status }: StatusBadgeProps) => (
  <span
    className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneForStatus(
      status
    )}`}
  >
    <span className="truncate">{status}</span>
  </span>
);
