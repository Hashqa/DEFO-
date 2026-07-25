"use client";

import { useEffect, useState, type FormEvent } from "react";
import { NavBar } from "../../components/NavBar";
import { apiFetch } from "../../lib/api";
import { useRequireAuth } from "../../lib/useRequireAuth";

interface ClientRecord {
  id: string;
  name: string;
  email?: string;
}

interface AppointmentRecord {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string;
  notes?: string;
  client: ClientRecord;
}

function formatRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const date = start.toLocaleDateString("fr-BE", { weekday: "short", day: "numeric", month: "short" });
  const startTime = start.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
  const endTime = end.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${startTime}–${endTime}`;
}

export default function AppointmentsPage() {
  useRequireAuth();

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    try {
      const data = await apiFetch<AppointmentRecord[]>("/appointments");
      setAppointments(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
    apiFetch<ClientRecord[]>("/clients")
      .then(setClients)
      .catch((err) => setError((err as Error).message));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await apiFetch("/appointments", {
        method: "POST",
        body: JSON.stringify({
          clientId,
          title,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          location: location || undefined,
          notes: notes || undefined,
        }),
      });
      setTitle("");
      setStartsAt("");
      setEndsAt("");
      setLocation("");
      setNotes("");
      const client = clients.find((c) => c.id === clientId);
      setNotice(
        client?.email
          ? `Rendez-vous créé — email de confirmation envoyé à ${client.email}.`
          : "Rendez-vous créé (ce client n'a pas d'adresse email, aucune confirmation envoyée)."
      );
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await apiFetch(`/appointments/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main>
      <NavBar active="/appointments" />
      <h1>Rendez-vous</h1>

      <form onSubmit={handleSubmit}>
        <input placeholder="Titre (ex. Visite chantier)" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <label>
          Client
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Début
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
        </label>
        <label>
          Fin
          <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
        </label>
        <input placeholder="Lieu (optionnel)" value={location} onChange={(e) => setLocation(e.target.value)} />
        <input placeholder="Notes (optionnel)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button type="submit">Créer le rendez-vous</button>
      </form>

      {error && <p role="alert">{error}</p>}
      {notice && <p>{notice}</p>}

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Quand</th>
              <th>Titre</th>
              <th>Client</th>
              <th>Lieu</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td>{formatRange(a.startsAt, a.endsAt)}</td>
                <td>{a.title}</td>
                <td>{a.client?.name}</td>
                <td>{a.location ?? "—"}</td>
                <td>
                  <button type="button" onClick={() => handleDelete(a.id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
