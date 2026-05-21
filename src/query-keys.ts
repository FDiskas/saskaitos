export const queryKeys = {
  settings: ['settings'] as const,
  clients: ['clients'] as const,
  client: (clientId: string) => ['clients', clientId] as const,
  invoiceList: ['invoices'] as const,
  invoice: (invoiceId: string) => ['invoices', invoiceId] as const,
  invoicesByClient: (clientId: string) => ['invoices', 'by-client', clientId] as const,
} as const;
