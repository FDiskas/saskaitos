export const queryKeys = {
  settings: ['settings'] as const,
  clients: ['clients'] as const,
  client: (clientId: string) => ['clients', clientId] as const,
  invoiceList: ['invoice-list'] as const,
  invoice: (invoiceId: string) => ['invoice', invoiceId] as const,
  invoicesByClient: (clientId: string) => ['invoices-by-client', clientId] as const,
} as const;
