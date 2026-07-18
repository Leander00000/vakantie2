import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BedDouble,
  Edit2,
  ExternalLink,
  FileWarning,
  GripVertical,
  MapPin,
  Plus,
  Route,
  Trash2,
} from "lucide-react";
import { EmptyState } from "../EmptyState";
import { StatusBadge } from "../StatusBadge";
import { formatDate, formatMoney } from "../../data/emptyTrip";
import type { AppData, Destination, Transport } from "../../types";
import { DestinationForm } from "./DestinationForm";
import { TransportForm } from "./TransportForm";

interface DestinationListProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
}

interface TransportDefaults {
  from?: string;
  to?: string;
  fromDestinationId?: string;
  toDestinationId?: string;
}

export const DestinationList = ({ data, setData }: DestinationListProps) => {
  const [showDestinationForm, setShowDestinationForm] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | undefined>();
  const [showTransportForm, setShowTransportForm] = useState(false);
  const [editingTransport, setEditingTransport] = useState<Transport | undefined>();
  const [transportDefaults, setTransportDefaults] = useState<TransportDefaults>({});

  const upsertDestination = (destination: Destination) => {
    setData((current) => {
      const exists = current.destinations.some((item) => item.id === destination.id);
      const previous = current.destinations.find((item) => item.id === destination.id);
      const previousName = previous?.name;
      const previousNameWasUnique = previousName
        ? current.destinations.filter((item) => item.name === previousName).length === 1
        : false;
      return {
        ...current,
        destinations: exists
          ? current.destinations.map((item) => (item.id === destination.id ? destination : item))
          : [...current.destinations, destination],
        transports: previous
          ? current.transports.map((transport) => {
              const fromMatches =
                transport.fromDestinationId === destination.id ||
                (!transport.fromDestinationId && previousNameWasUnique && transport.from === previousName);
              const toMatches =
                transport.toDestinationId === destination.id ||
                (!transport.toDestinationId && previousNameWasUnique && transport.to === previousName);
              return {
                ...transport,
                from: fromMatches ? destination.name : transport.from,
                to: toMatches ? destination.name : transport.to,
                fromDestinationId: fromMatches ? destination.id : transport.fromDestinationId,
                toDestinationId: toMatches ? destination.id : transport.toDestinationId,
              };
            })
          : current.transports,
      };
    });
    setShowDestinationForm(false);
    setEditingDestination(undefined);
  };

  const deleteDestination = (id: string) => {
    const destination = data.destinations.find((item) => item.id === id);
    if (!destination) return;
    const nameIsUnique = data.destinations.filter((item) => item.name === destination.name).length === 1;
    const relatedTransports = data.transports.filter((transport) =>
      transport.fromDestinationId === id ||
      transport.toDestinationId === id ||
      (nameIsUnique &&
        ((!transport.fromDestinationId && transport.from === destination.name) ||
          (!transport.toDestinationId && transport.to === destination.name)))
    );
    const suffix = relatedTransports.length
      ? ` Ook ${relatedTransports.length} gekoppelde verplaatsing(en) worden verwijderd.`
      : "";
    if (!window.confirm(`Deze bestemming verwijderen?${suffix}`)) return;
    const transportIds = new Set(relatedTransports.map((transport) => transport.id));
    setData((current) => ({
      ...current,
      destinations: current.destinations.filter((item) => item.id !== id),
      transports: current.transports.filter((transport) => !transportIds.has(transport.id)),
      dayPlans: current.dayPlans.map((day) => ({
        ...day,
        transportIds: day.transportIds.filter((transportId) => !transportIds.has(transportId)),
      })),
      expenses: current.expenses.map((expense) =>
        expense.destinationId === id ? { ...expense, destinationId: "" } : expense
      ),
      documents: current.documents.map((document) => ({
        ...document,
        linkedDestinationId: document.linkedDestinationId === id ? "" : document.linkedDestinationId,
        linkedTransportId: transportIds.has(document.linkedTransportId) ? "" : document.linkedTransportId,
      })),
      activities: current.activities.map((activity) =>
        activity.destinationId === id ? { ...activity, destinationId: "" } : activity
      ),
    }));
  };

  const moveDestination = (index: number, direction: -1 | 1) => {
    setData((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.destinations.length) return current;
      const destinations = [...current.destinations];
      [destinations[index], destinations[nextIndex]] = [destinations[nextIndex], destinations[index]];
      return { ...current, destinations };
    });
  };

  const upsertTransport = (transport: Transport) => {
    setData((current) => {
      const exists = current.transports.some((item) => item.id === transport.id);
      const selectedDocumentIds = new Set(transport.documentIds);
      const transports = (exists
        ? current.transports.map((item) => (item.id === transport.id ? transport : item))
        : [...current.transports, transport]
      ).map((item) =>
        item.id === transport.id
          ? item
          : { ...item, documentIds: item.documentIds.filter((id) => !selectedDocumentIds.has(id)) }
      );
      return {
        ...current,
        transports,
        documents: current.documents.map((document) => ({
          ...document,
          linkedTransportId: selectedDocumentIds.has(document.id)
            ? transport.id
            : document.linkedTransportId === transport.id
              ? ""
              : document.linkedTransportId,
        })),
      };
    });
    setShowTransportForm(false);
    setEditingTransport(undefined);
    setTransportDefaults({});
  };

  const deleteTransport = (id: string) => {
    if (!window.confirm("Dit vervoersitem verwijderen?")) return;
    setData((current) => ({
      ...current,
      transports: current.transports.filter((transport) => transport.id !== id),
      dayPlans: current.dayPlans.map((day) => ({
        ...day,
        transportIds: day.transportIds.filter((transportId) => transportId !== id),
      })),
      documents: current.documents.map((document) =>
        document.linkedTransportId === id ? { ...document, linkedTransportId: "" } : document
      ),
    }));
  };

  const startTransport = (defaults: TransportDefaults = {}) => {
    setEditingTransport(undefined);
    setTransportDefaults(defaults);
    setShowTransportForm(true);
  };

  const matchingTransportIds = new Set<string>();
  const transportConnects = (transport: Transport, from: Destination, to: Destination) =>
    (transport.fromDestinationId === from.id && transport.toDestinationId === to.id) ||
    (data.destinations.filter((destination) => destination.name === from.name).length === 1 &&
      data.destinations.filter((destination) => destination.name === to.name).length === 1 &&
      !transport.fromDestinationId &&
      !transport.toDestinationId &&
      transport.from === from.name &&
      transport.to === to.name);

  data.destinations.forEach((destination, index) => {
    const nextDestination = data.destinations[index + 1];
    if (!nextDestination) return;
    data.transports
      .filter((transport) => transportConnects(transport, destination, nextDestination))
      .forEach((transport) => matchingTransportIds.add(transport.id));
  });

  const getBetweenTransports = (from: Destination, to: Destination) =>
    data.transports.filter((transport) => transportConnects(transport, from, to));

  const renderTransport = (transport: Transport) => (
    <div
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
      key={transport.id}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Route size={17} className="text-mint-700" />
          <p className="font-semibold text-slate-900">
            {transport.from} naar {transport.to}
          </p>
          <StatusBadge status={transport.status} />
          {["geboekt", "betaald"].includes(transport.status) &&
          transport.documentIds.length === 0 &&
          !data.documents.some((document) => document.linkedTransportId === transport.id) ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
              <FileWarning size={13} />
              Boeking heeft nog geen document.
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {transport.provider ? `${transport.provider} · ` : ""}{transport.mode}
          {transport.routeDescription ? ` · ${transport.routeDescription}` : ""}
          {transport.departureDate ? ` · ${formatDate(transport.departureDate)}` : ""}
          {transport.departureTime ? ` om ${transport.departureTime}` : ""}
          {transport.cost ? ` · ${formatMoney(transport.cost, data.trip?.currency)}` : ""}
        </p>
      </div>
      <div className="flex gap-2">
        {transport.bookingLink ? (
          <a className="icon-btn" href={transport.bookingLink} rel="noreferrer" target="_blank" title="Boeking openen">
            <ExternalLink size={16} />
          </a>
        ) : null}
        <button
          className="icon-btn"
          type="button"
          title="Vervoer bewerken"
          onClick={() => {
            setEditingTransport(transport);
            setShowTransportForm(true);
          }}
        >
          <Edit2 size={16} />
        </button>
        <button
          className="icon-btn text-rose-600"
          type="button"
          title="Vervoer verwijderen"
          onClick={() => deleteTransport(transport.id)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  const unmatchedTransports = data.transports.filter((transport) => !matchingTransportIds.has(transport.id));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Route-overzicht</h2>
          <p className="text-sm text-slate-500">Bestemmingen en vervoer blijven leeg totdat je ze toevoegt.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" type="button" onClick={() => startTransport()}>
            <Plus size={16} />
            Vervoer toevoegen
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              setEditingDestination(undefined);
              setShowDestinationForm(true);
            }}
          >
            <Plus size={16} />
            Bestemming toevoegen
          </button>
        </div>
      </div>

      {showDestinationForm ? (
        <DestinationForm
          initial={editingDestination}
          onCancel={() => {
            setShowDestinationForm(false);
            setEditingDestination(undefined);
          }}
          onSubmit={upsertDestination}
        />
      ) : null}

      {showTransportForm ? (
        <TransportForm
          destinations={data.destinations}
          defaultFrom={transportDefaults.from}
          defaultTo={transportDefaults.to}
          defaultFromDestinationId={transportDefaults.fromDestinationId}
          defaultToDestinationId={transportDefaults.toDestinationId}
          documents={data.documents}
          initial={editingTransport}
          onCancel={() => {
            setShowTransportForm(false);
            setEditingTransport(undefined);
            setTransportDefaults({});
          }}
          onSubmit={upsertTransport}
        />
      ) : null}

      {data.destinations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Nog geen bestemmingen toegevoegd"
          description="Voeg je eerste bestemming toe om je route op te bouwen."
          actionLabel="Voeg je eerste bestemming toe"
          onAction={() => setShowDestinationForm(true)}
        />
      ) : (
        <div className="space-y-3">
          {data.destinations.map((destination, index) => {
            const nextDestination = data.destinations[index + 1];
            const betweenTransports = nextDestination
              ? getBetweenTransports(destination, nextDestination)
              : [];
            const linkedAccommodationDoc = data.documents.some(
              (document) => document.linkedDestinationId === destination.id
            );

            return (
              <div key={destination.id}>
                <div className="panel">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <GripVertical size={17} className="text-slate-400" />
                        <h3 className="text-lg font-bold text-slate-950">{destination.name}</h3>
                        <StatusBadge status={destination.type} />
                      </div>
                      <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <p className="label">Nachten</p>
                          <p className="mt-1 font-semibold text-slate-900">{destination.nights}</p>
                        </div>
                        <div>
                          <p className="label">Verblijfstatus</p>
                          <div className="mt-1">
                            <StatusBadge status={destination.accommodationStatus} />
                          </div>
                        </div>
                        <div>
                          <p className="label">Vervoerstatus</p>
                          <div className="mt-1">
                            <StatusBadge status={destination.transportStatus} />
                          </div>
                        </div>
                        <div>
                          <p className="label">Datums</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {formatDate(destination.arrivalDate)} - {formatDate(destination.departureDate)}
                          </p>
                        </div>
                      </div>
                      {destination.notes ? (
                        <p className="mt-3 text-sm text-slate-500">{destination.notes}</p>
                      ) : null}
                      {destination.accommodationName ? (
                        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                              <BedDouble size={14} /> Verblijf
                            </p>
                            <p className="mt-1 font-semibold text-slate-900">{destination.accommodationName}</p>
                            {destination.accommodationAddress ? (
                              <p className="mt-0.5 text-sm text-slate-500">{destination.accommodationAddress}</p>
                            ) : null}
                            {destination.checkInTime || destination.checkOutTime ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {destination.checkInTime ? `Inchecken ${destination.checkInTime}` : ""}
                                {destination.checkInTime && destination.checkOutTime ? " · " : ""}
                                {destination.checkOutTime ? `Uitchecken ${destination.checkOutTime}` : ""}
                              </p>
                            ) : null}
                          </div>
                          {destination.accommodationLink ? (
                            <a className="btn-secondary shrink-0" href={destination.accommodationLink} rel="noreferrer" target="_blank">
                              <ExternalLink size={15} /> Open verblijf
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                      {["geboekt", "betaald"].includes(destination.accommodationStatus) && !linkedAccommodationDoc ? (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                          <FileWarning size={16} />
                          Verblijf heeft nog geen document.
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className="icon-btn"
                        type="button"
                        title="Omhoog"
                        disabled={index === 0}
                        onClick={() => moveDestination(index, -1)}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        type="button"
                        title="Omlaag"
                        disabled={index === data.destinations.length - 1}
                        onClick={() => moveDestination(index, 1)}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        type="button"
                        title="Bestemming bewerken"
                        onClick={() => {
                          setEditingDestination(destination);
                          setShowDestinationForm(true);
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="icon-btn text-rose-600"
                        type="button"
                        title="Bestemming verwijderen"
                        onClick={() => deleteDestination(destination.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {nextDestination ? (
                  <div className="my-3 ml-6 border-l-2 border-dashed border-mint-200 pl-4">
                    {betweenTransports.length > 0 ? (
                      <div className="space-y-2">{betweenTransports.map(renderTransport)}</div>
                    ) : (
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() =>
                          startTransport({
                            from: destination.name,
                            to: nextDestination.name,
                            fromDestinationId: destination.id,
                            toDestinationId: nextDestination.id,
                          })
                        }
                      >
                        <Plus size={16} />
                        Vervoer tussen deze stops toevoegen
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {data.transports.length === 0 ? (
        <EmptyState
          icon={Route}
          title="Nog geen vervoer gepland"
          description="Voeg vervoer toe zodra je zelf een route of boeking wilt vastleggen."
          actionLabel="Vervoer toevoegen"
          onAction={() => startTransport()}
        />
      ) : unmatchedTransports.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-950">Overig vervoer</h3>
          {unmatchedTransports.map(renderTransport)}
        </section>
      ) : null}
    </div>
  );
};
