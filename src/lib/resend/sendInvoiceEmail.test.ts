import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendInvoiceEmail } from './sendInvoiceEmail';

describe('sendInvoiceEmail', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('when sending email without PDF, then makes POST request with correct payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email-id' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await sendInvoiceEmail({
      to: 'klientas@imone.lt',
      cc: 'kopija@imone.lt',
      subject: 'Testinė sąskaita',
      body: 'Sveiki,\nSiunčiame sąskaitą.',
      apiKey: 're_123456789',
      fromEmail: 'info@imone.lt',
      fromName: 'Pardavėjas',
    });

    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer re_123456789',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pardavėjas <info@imone.lt>',
        to: ['klientas@imone.lt'],
        cc: ['kopija@imone.lt'],
        subject: 'Testinė sąskaita',
        html: 'Sveiki,<br />Siunčiame sąskaitą.',
        attachments: undefined,
      }),
    });
  });

  it('when sending email with PDF blob, then converts to base64 and attaches', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email-id' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    // Create a dummy text blob to represent a PDF
    const dummyPdfBlob = new Blob(['%PDF-1.4 dummy content'], { type: 'application/pdf' });

    await sendInvoiceEmail({
      to: 'klientas@imone.lt',
      subject: 'Testinė sąskaita',
      body: 'Siunčiame sąskaitą.',
      pdfBlob: dummyPdfBlob,
      pdfFilename: 'invoice.pdf',
      apiKey: 're_123',
      fromEmail: 'info@imone.lt',
    });

    expect(fetchMock).toHaveBeenCalled();
    const calls = fetchMock.mock.calls;
    const bodyObj = JSON.parse((calls[0] as any)[1].body);

    expect(bodyObj.attachments).toHaveLength(1);
    expect(bodyObj.attachments[0].filename).toBe('invoice.pdf');
    expect(bodyObj.attachments[0].content).toBeTypeOf('string');
    // Check if the content is valid base64 (corresponds to our input)
    expect(bodyObj.attachments[0].content).toBe(btoa('%PDF-1.4 dummy content'));
  });

  it('when Resend API returns error, then sendInvoiceEmail throws error with message', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Invalid API Key' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      sendInvoiceEmail({
        to: 'klientas@imone.lt',
        subject: 'Test',
        body: 'Test',
        apiKey: 're_invalid',
        fromEmail: 'info@imone.lt',
      })
    ).rejects.toThrow('Invalid API Key');
  });
});
