import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CompanyProfilesList } from './CompanyProfilesList';

describe('CompanyProfilesList', () => {
  it('when list is empty, then shows empty state and add action', () => {
    const onAdd = vi.fn();

    render(
      <CompanyProfilesList
        profiles={[]}
        activeId={null}
        onAdd={onAdd}
        onDelete={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Juridinių vienetų dar nėra. Sukurkite pirmąjį įrašą.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pridėti juridinį vienetą' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('when actions are clicked, then select and delete handlers are called with profile id', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(
      <CompanyProfilesList
        profiles={[
          {
            id: 'company-1',
            company: {
              name: 'UAB Pirmas',
              code: '123456789',
              vatCode: '',
              address: 'Vilnius',
              iban: 'LT121234567890123456',
              bankName: 'Swedbank',
              email: 'test@example.lt',
              phone: '+37060000000',
            },
          },
        ]}
        activeId={null}
        onAdd={vi.fn()}
        onDelete={onDelete}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Redaguoti' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trinti' }));

    expect(onSelect).toHaveBeenCalledWith('company-1');
    expect(onDelete).toHaveBeenCalledWith('company-1');
  });
});
