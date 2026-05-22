import { describe, it, expect } from 'vitest';
import { resolveRedirectTarget } from './redirectTarget';

describe('resolveRedirectTarget', () => {
  it('when from is undefined, returns /dashboard', () => {
    expect(resolveRedirectTarget(undefined)).toBe('/dashboard');
  });

  it('when from is empty string, returns /dashboard', () => {
    expect(resolveRedirectTarget('')).toBe('/dashboard');
  });

  it('when from is local path /clients, returns /clients', () => {
    expect(resolveRedirectTarget('/clients')).toBe('/clients');
  });

  it('when from is local path with query, preserves query', () => {
    expect(resolveRedirectTarget('/invoice-editor/abc?clientId=x')).toBe(
      '/invoice-editor/abc?clientId=x',
    );
  });

  it('when from points back to /login, returns /dashboard to avoid loop', () => {
    expect(resolveRedirectTarget('/login')).toBe('/dashboard');
  });

  it('when from is absolute https url, returns /dashboard', () => {
    expect(resolveRedirectTarget('https://evil.example.com/')).toBe('/dashboard');
  });

  it('when from is protocol-relative //host, returns /dashboard', () => {
    expect(resolveRedirectTarget('//evil.example.com/path')).toBe('/dashboard');
  });

  it('when from does not start with /, returns /dashboard', () => {
    expect(resolveRedirectTarget('clients')).toBe('/dashboard');
  });
});
