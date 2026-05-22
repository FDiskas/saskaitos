import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompanyTab } from './CompanyTab';
import type { CompanyDto } from '@/lib/drive/settings';

function makeCompany(name: string): CompanyDto {
  return {
    name,
    code: '123456789',
    vatCode: 'LT123456789',
    address: 'Vilnius',
    iban: 'LT121234567890123456',
    bankName: 'Swedbank',
    email: 'test@example.lt',
    phone: '+37060000000',
  };
}

describe('CompanyTab', () => {
  it('when value prop changes, then form resets to selected company values', () => {
    const onChange = vi.fn();
    const first = makeCompany('UAB Pirmas');
    const second = makeCompany('UAB Antras');

    const { rerender } = render(<CompanyTab value={first} onChange={onChange} />);

    expect(screen.getByPlaceholderText('UAB Pavyzdys')).toHaveValue('UAB Pirmas');

    rerender(<CompanyTab value={second} onChange={onChange} />);

    expect(screen.getByPlaceholderText('UAB Pavyzdys')).toHaveValue('UAB Antras');
  });
});
