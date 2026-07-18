import type { FormEvent } from "react";
import { useState } from "react";
import { formatFileSize } from "../../lib/documentStorage";
import {
  documentTypes,
  type AppData,
  type DocumentType,
  type TravelDocument,
} from "../../types";

interface DocumentFormProps {
  data: AppData;
  document: TravelDocument;
  onSubmit: (document: TravelDocument) => void;
  onCancel: () => void;
}

export const DocumentForm = ({ data, document, onSubmit, onCancel }: DocumentFormProps) => {
  const [form, setForm] = useState<TravelDocument>(() => ({
    ...document,
    linkedDayId:
      document.linkedDayId ||
      data.dayPlans.find((day) => day.documentIds.includes(document.id))?.id ||
      "",
    linkedDestinationId: document.linkedDestinationId ?? "",
    linkedExpenseId:
      document.linkedExpenseId ||
      data.expenses.find((expense) => expense.documentIds.includes(document.id))?.id ||
      "",
    linkedTransportId:
      document.linkedTransportId ||
      data.transports.find((transport) => transport.documentIds.includes(document.id))?.id ||
      "",
    size: document.size ?? 0,
  }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      ...form,
      linkedDayId: data.dayPlans.some((day) => day.id === form.linkedDayId) ? form.linkedDayId : "",
      linkedDestinationId: data.destinations.some(
        (destination) => destination.id === form.linkedDestinationId
      )
        ? form.linkedDestinationId
        : "",
      linkedExpenseId: data.expenses.some((expense) => expense.id === form.linkedExpenseId)
        ? form.linkedExpenseId
        : "",
      linkedTransportId: data.transports.some(
        (transport) => transport.id === form.linkedTransportId
      )
        ? form.linkedTransportId
        : "",
      notes: form.notes.trim(),
    });
  };

  return (
    <form className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="xl:col-span-2">
          <span className="label">Bestandsnaam</span>
          <p className="mt-1 break-all rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900">
            {form.fileName}
          </p>
        </div>

        <label>
          <span className="label">Type document</span>
          <select
            autoFocus
            className="input mt-1"
            value={form.documentType}
            onChange={(event) => setForm({ ...form, documentType: event.target.value as DocumentType })}
          >
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="label">Bestandsinformatie</span>
          <p className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            {form.fileType} · {form.size > 0 ? formatFileSize(form.size) : "grootte onbekend"}
          </p>
        </div>

        <label>
          <span className="label">Gekoppelde dag</span>
          <select
            className="input mt-1"
            value={form.linkedDayId}
            onChange={(event) => setForm({ ...form, linkedDayId: event.target.value })}
          >
            <option value="">Geen dag</option>
            {data.dayPlans.map((day) => (
              <option key={day.id} value={day.id}>
                Dag {day.dayNumber} - {day.date}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Gekoppelde bestemming</span>
          <select
            className="input mt-1"
            value={form.linkedDestinationId}
            onChange={(event) => setForm({ ...form, linkedDestinationId: event.target.value })}
          >
            <option value="">Geen bestemming</option>
            {data.destinations.map((destination) => (
              <option key={destination.id} value={destination.id}>
                {destination.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Gekoppeld vervoer</span>
          <select
            className="input mt-1"
            value={form.linkedTransportId}
            onChange={(event) => setForm({ ...form, linkedTransportId: event.target.value })}
          >
            <option value="">Geen vervoer</option>
            {data.transports.map((transport) => (
              <option key={transport.id} value={transport.id}>
                {transport.from} → {transport.to} ({transport.mode})
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Gekoppelde budgetpost</span>
          <select
            className="input mt-1"
            value={form.linkedExpenseId}
            onChange={(event) => setForm({ ...form, linkedExpenseId: event.target.value })}
          >
            <option value="">Geen budgetpost</option>
            {data.expenses.map((expense) => (
              <option key={expense.id} value={expense.id}>
                {expense.title}
              </option>
            ))}
          </select>
        </label>

        <label className="md:col-span-2 xl:col-span-4">
          <span className="label">Notities</span>
          <textarea
            className="input mt-1 min-h-24"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </label>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <button className="btn-secondary" type="button" onClick={onCancel}>
          Annuleren
        </button>
        <button className="btn-primary" type="submit">
          Document opslaan
        </button>
      </div>
    </form>
  );
};
