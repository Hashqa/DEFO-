export interface DocumentRecord {
  id: string;
  type: "QUOTE" | "INVOICE";
  direction: "PURCHASE" | "SALE";
  sequenceNumber: string;
  status: string;
  totalInclVat: string;
  client: { name: string; isBusiness: boolean; peppolAddress?: string };
  peppolSentAt?: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  PAID: "Payé",
  OVERDUE: "En retard",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{STATUS_LABELS[status] ?? status}</span>;
}

interface DocumentsTableProps {
  documents: DocumentRecord[];
  onViewPdf: (id: string) => void;
  onConvertToInvoice?: (id: string) => void;
  onSendPeppol?: (id: string) => void;
}

export function DocumentsTable({ documents, onViewPdf, onConvertToInvoice, onSendPeppol }: DocumentsTableProps) {
  return (
    <div className="table-scroll">
      <table>
      <thead>
        <tr>
          <th>N°</th>
          <th>Client</th>
          <th>Statut</th>
          <th>Total TTC</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {documents.map((d) => (
          <tr key={d.id}>
            <td>{d.sequenceNumber}</td>
            <td>{d.client?.name}</td>
            <td>
              <StatusBadge status={d.status} />
            </td>
            <td>{d.totalInclVat} €</td>
            <td>
              <button type="button" onClick={() => onViewPdf(d.id)}>
                PDF
              </button>
              {onConvertToInvoice && d.type === "QUOTE" && (
                <button type="button" onClick={() => onConvertToInvoice(d.id)}>
                  Convertir en facture
                </button>
              )}
              {onSendPeppol && d.type === "INVOICE" && d.direction === "SALE" && d.client?.isBusiness && d.client?.peppolAddress && (
                <button type="button" onClick={() => onSendPeppol(d.id)} disabled={Boolean(d.peppolSentAt)}>
                  {d.peppolSentAt ? "Envoyé via Peppol" : "Envoyer via Peppol"}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  );
}
