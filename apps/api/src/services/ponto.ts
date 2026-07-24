const BASE_URL = process.env.PONTO_BASE_URL ?? "https://api.myponto.com";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }
  const clientId = process.env.PONTO_CLIENT_ID;
  const clientSecret = process.env.PONTO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PONTO_CLIENT_ID / PONTO_CLIENT_SECRET non configurés");
  }
  const res = await fetch(`${BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new Error(`Erreur d'authentification Ponto (${res.status})`);
  }
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in - 60) * 1000 };
  return cachedToken.value;
}

async function pontoFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body.errors?.[0]?.detail ?? `Erreur Ponto ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}

export interface PontoAccount {
  id: string;
  reference: string; // IBAN
  currentBalance: number;
  currency: string;
  description: string;
}

interface JsonApiResource<A> {
  id: string;
  type: string;
  attributes: A;
}

interface JsonApiList<A> {
  data: JsonApiResource<A>[];
  links: { next?: string };
}

/** Comptes bancaires liés à l'organisation Ponto (AIS — lecture seule). */
export async function listAccounts(): Promise<PontoAccount[]> {
  const result = await pontoFetch<JsonApiList<Omit<PontoAccount, "id">>>("/accounts");
  return result.data.map((item) => ({ id: item.id, ...item.attributes }));
}

export interface PontoTransaction {
  id: string;
  amount: number;
  currency: string;
  valueDate: string;
  remittanceInformation?: string;
  description?: string;
}

/** Transactions d'un compte, paginées — on s'arrête après `maxPages` pour éviter de tout parcourir. */
export async function listTransactions(accountId: string, maxPages = 5): Promise<PontoTransaction[]> {
  const transactions: PontoTransaction[] = [];
  let path: string | undefined = `/accounts/${accountId}/transactions`;
  for (let page = 0; path && page < maxPages; page++) {
    const result: JsonApiList<Omit<PontoTransaction, "id">> = await pontoFetch(path);
    transactions.push(...result.data.map((item) => ({ id: item.id, ...item.attributes })));
    path = result.links.next?.replace(BASE_URL, "");
  }
  return transactions;
}
