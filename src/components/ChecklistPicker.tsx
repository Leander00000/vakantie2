interface ChecklistOption {
  value: string;
  label: string;
  detail?: string;
}

interface ChecklistPickerProps {
  legend: string;
  options: ChecklistOption[];
  value: string[];
  onChange: (value: string[]) => void;
  emptyLabel?: string;
  hint?: string;
}

export const ChecklistPicker = ({
  legend,
  options,
  value,
  onChange,
  emptyLabel = "Nog niets beschikbaar om te koppelen.",
  hint,
}: ChecklistPickerProps) => {
  const selected = new Set(value);

  const toggle = (optionValue: string, checked: boolean) => {
    const next = checked
      ? [...value.filter((item) => item !== optionValue), optionValue]
      : value.filter((item) => item !== optionValue);
    onChange(next);
  };

  return (
    <fieldset className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {legend}
      </legend>
      {options.length > 0 ? (
        <div className="mt-1 max-h-44 space-y-2 overflow-y-auto pr-1">
          {options.map((option) => {
            const checked = selected.has(option.value);
            return (
              <label
                className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  checked
                    ? "border-mint-300 bg-mint-50 text-mint-950"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
                key={option.value}
              >
                <input
                  checked={checked}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-mint-600"
                  type="checkbox"
                  onChange={(event) => toggle(option.value, event.target.checked)}
                />
                <span className="min-w-0">
                  <span className="block break-words font-semibold">{option.label}</span>
                  {option.detail ? (
                    <span className="mt-0.5 block break-words text-xs text-slate-500">
                      {option.detail}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">{emptyLabel}</p>
      )}
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </fieldset>
  );
};
