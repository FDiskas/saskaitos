import { describe, it, expect } from 'vitest';
import { Client } from './Client';
import { ClientId } from './ClientId';

const id = ClientId.create();

describe('Client', () => {
  it('when created with basic fields, then accessors work', () => {
    const c = Client.of({
      id,
      name: 'UAB Testas',
      address: 'Vilnius',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(c.name).toBe('UAB Testas');
    expect(c.address).toBe('Vilnius');
  });

  it('when slug computed from "UAB Testas", then "uab-testas"', () => {
    const c = Client.of({
      id,
      name: 'UAB Testas',
      address: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(c.slug()).toBe('uab-testas');
  });

  it('when slug from lithuanian diacritics, then strips to ascii', () => {
    const c = Client.of({
      id,
      name: 'Ąžuolų Šakelė',
      address: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(c.slug()).toBe('azuolu-sakele');
  });

  it('when slug from messy name, then collapses spaces and trims', () => {
    const c = Client.of({
      id,
      name: '  Foo   Bar!!!  Baz  ',
      address: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(c.slug()).toBe('foo-bar-baz');
  });

  it('when withPatch applied, then returns new instance', () => {
    const c = Client.of({
      id,
      name: 'A',
      address: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const patched = c.withPatch({ name: 'B' });
    expect(c.name).toBe('A');
    expect(patched.name).toBe('B');
  });
});
