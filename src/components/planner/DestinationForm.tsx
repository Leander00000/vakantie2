import { useState } from "react";
import { calculateNights } from "../../data/emptyTrip";
import {
  destinationTypes,
  stayStatuses,
  type Destination,
  type DestinationType,
  type StayStatus,
} from "../../types";
import { createId } from "../../data/emptyTrip";

interface DestinationFormProps {
  initial?: Destination;
  onSubmit: (destination: Destination) => void;
  onCancel: () => void;
}

const createEmptyDestination = (): Destination => ({
  id: createId("dest"),
  name: "",
  type: "verblijfplaats",
  arrivalDate: "",
  departureDate: "",
  nights: 0,
  accommodationStatus: "nog zoeken",
  transportStatus: "nog zoeken",
  accommodationLink: "",
  transportLink: "",
  accommodationName: "",
  accommodationAddress: "",
  accommodationReference: "",
  checkInTime: "",
  checkOutTime: "",
  notes: "",
});

export const DestinationForm = ({ initial, onSubmit, onCancel }: DestinationFormProps) => {
  const [form, setForm] = useState<Destination>(() => ({
    ...createEmptyDestination(),
    ...initial,
  }));
  const [error, setError] = useState("");
  const nights = calculateNights(form.arrivalDate, form.departureDate);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Vul een bestemming in.");
      return;
    }
    if (form.arrivalDate && form.departureDate && form.departureDate < form.arrivalDate) {
      setError("De vertrekdatum kan niet vóór de aankomstdatum liggen.");
      return;
    }
    onSubmit({
      ...form,
      name: form.name.trim(),
      accommodationName: form.accommodationName.trim(),
      accommodationAddress: form.accommodationAddress.trim(),
      accommodationReference: form.accommodationReference.trim(),
      nights,
    });
  };

  return (
    <form className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="xl:col-span-2">
          <span className="label">Naam bestemming</span>
          <input
            className="input mt-1"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Zelf invullen"
            autoFocus
          />
        </label>

        <label>
          <span className="label">Type</span>
          <select
            className="input mt-1"
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value as DestinationType })}
          >
            {destinationTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="label">Nachten</span>
          <div className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
            {nights}
          </div>
        </div>

        <label>
          <span className="label">Aankomstdatum</span>
          <input
            className="input mt-1"
            type="date"
            max={form.departureDate || undefined}
            value={form.arrivalDate}
            onChange={(event) => setForm({ ...form, arrivalDate: event.target.value })}
          />
        </label>

        <label>
          <span className="label">Vertrekdatum</span>
          <input
            className="input mt-1"
            type="date"
            min={form.arrivalDate || undefined}
            value={form.departureDate}
            onChange={(event) => setForm({ ...form, departureDate: event.target.value })}
          />
        </label>

        <label>
          <span className="label">Verblijfstatus</span>
          <select
            className="input mt-1"
            value={form.accommodationStatus}
            onChange={(event) =>
              setForm({ ...form, accommodationStatus: event.target.value as StayStatus })
            }
          >
            {stayStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Vervoerstatus</span>
          <select
            className="input mt-1"
            value={form.transportStatus}
            onChange={(event) => setForm({ ...form, transportStatus: event.target.value as StayStatus })}
          >
            {stayStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="md:col-span-2">
          <span className="label">Link naar accommodatie</span>
          <input
            className="input mt-1"
            type="url"
            value={form.accommodationLink}
            onChange={(event) => setForm({ ...form, accommodationLink: event.target.value })}
            placeholder="https://"
          />
        </label>

        <label className="md:col-span-2">
          <span className="label">Link naar vervoer</span>
          <input
            className="input mt-1"
            type="url"
            value={form.transportLink}
            onChange={(event) => setForm({ ...form, transportLink: event.target.value })}
            placeholder="https://"
          />
        </label>

        <div className="md:col-span-2 xl:col-span-4 mt-1 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">Verblijfsgegevens</h3>
          <p className="mt-1 text-sm text-slate-500">
            Optioneel, handig zodra je een accommodatie hebt gekozen of geboekt.
          </p>
        </div>

        <label className="md:col-span-2">
          <span className="label">Naam accommodatie</span>
          <input
            className="input mt-1"
            value={form.accommodationName}
            onChange={(event) => setForm({ ...form, accommodationName: event.target.value })}
            placeholder="Hotel, appartement of verblijf"
          />
        </label>

        <label className="md:col-span-2">
          <span className="label">Adres accommodatie</span>
          <input
            className="input mt-1"
            value={form.accommodationAddress}
            onChange={(event) => setForm({ ...form, accommodationAddress: event.target.value })}
            placeholder="Straat, plaats of praktische aanwijzing"
          />
        </label>

        <label className="md:col-span-2">
          <span className="label">Boekingsnummer</span>
          <input
            className="input mt-1"
            value={form.accommodationReference}
            onChange={(event) => setForm({ ...form, accommodationReference: event.target.value })}
            placeholder="Optionele reserveringscode"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
          <label>
            <span className="label">Inchecktijd</span>
            <input
              className="input mt-1"
              type="time"
              value={form.checkInTime}
              onChange={(event) => setForm({ ...form, checkInTime: event.target.value })}
            />
          </label>
          <label>
            <span className="label">Uitchecktijd</span>
            <input
              className="input mt-1"
              type="time"
              value={form.checkOutTime}
              onChange={(event) => setForm({ ...form, checkOutTime: event.target.value })}
            />
          </label>
        </div>

        <label className="md:col-span-2 xl:col-span-4">
          <span className="label">Notities</span>
          <textarea
            className="input mt-1 min-h-24"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </label>
      </div>

      {error ? (
        <p className="text-sm font-semibold text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <button className="btn-secondary" type="button" onClick={onCancel}>
          Annuleren
        </button>
        <button className="btn-primary" type="submit">
          Bestemming opslaan
        </button>
      </div>
    </form>
  );
};
