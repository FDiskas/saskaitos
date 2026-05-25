import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RequireAuth } from './RequireAuth';

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: { useInMemory: false, googleClientId: 'x.apps.googleusercontent.com' },
}));

const mockNavigate = vi.fn<(props: { to: string; search?: Record<string, unknown>; replace?: boolean }) => null>(
  () => null,
);
const mockUseLocation = vi.fn<() => { href: string; pathname: string }>(() => ({
  href: '/dashboard',
  pathname: '/dashboard',
}));

vi.mock('@tanstack/react-router', () => ({
  Navigate: (props: { to: string; search?: Record<string, unknown>; replace?: boolean }) => {
    mockNavigate(props);
    return <div data-testid="navigate" data-to={props.to} data-search={JSON.stringify(props.search ?? {})} />;
  },
  useLocation: () => mockUseLocation(),
}));

const mockUseGoogleAuth = vi.fn();
vi.mock('@/hooks', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useGoogleAuth: () => mockUseGoogleAuth(),
  };
});

vi.mock('@/env', () => ({ env: mockEnv }));

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.useInMemory = false;
    mockUseLocation.mockReturnValue({ href: '/dashboard', pathname: '/dashboard' });
  });

  it('when authenticated, renders children', () => {
    mockUseGoogleAuth.mockReturnValue({ isAuthenticated: true, isRestoring: false });
    render(
      <RequireAuth>
        <div>protected</div>
      </RequireAuth>,
    );
    expect(screen.getByText('protected')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('when restoring, renders nothing (no redirect, no children)', () => {
    mockUseGoogleAuth.mockReturnValue({ isAuthenticated: false, isRestoring: true });
    render(
      <RequireAuth>
        <div>protected</div>
      </RequireAuth>,
    );
    expect(screen.queryByText('protected')).not.toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('when unauthenticated and not restoring, redirects to /login with from=current href', () => {
    mockUseLocation.mockReturnValue({
      href: '/invoice-editor/abc?clientId=x',
      pathname: '/invoice-editor/abc',
    });
    mockUseGoogleAuth.mockReturnValue({ isAuthenticated: false, isRestoring: false });
    render(
      <RequireAuth>
        <div>protected</div>
      </RequireAuth>,
    );
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/login',
      search: { from: '/invoice-editor/abc?clientId=x' },
      replace: true,
    });
    expect(screen.queryByText('protected')).not.toBeInTheDocument();
  });

  it('when re-rendered with new /login href during transition, still uses original captured href', () => {
    mockUseLocation.mockReturnValue({ href: '/clients', pathname: '/clients' });
    mockUseGoogleAuth.mockReturnValue({ isAuthenticated: false, isRestoring: false });
    const { rerender } = render(
      <RequireAuth>
        <div>p</div>
      </RequireAuth>,
    );
    mockUseLocation.mockReturnValue({
      href: '/login?from=%2Fclients',
      pathname: '/login',
    });
    rerender(
      <RequireAuth>
        <div>p</div>
      </RequireAuth>,
    );
    const fromValues = mockNavigate.mock.calls.map((call) => call[0].search);
    expect(fromValues[0]).toEqual({ from: '/clients' });
    // Second render: now on /login pathname → no further redirect (returns null)
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('when pathname is already /login, renders null (no redirect)', () => {
    mockUseLocation.mockReturnValue({
      href: '/login?from=%2Fdashboard',
      pathname: '/login',
    });
    mockUseGoogleAuth.mockReturnValue({ isAuthenticated: false, isRestoring: false });
    const { container } = render(
      <RequireAuth>
        <div>protected</div>
      </RequireAuth>,
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
  });

  it('when useInMemory is true, always renders children even if unauthenticated', () => {
    mockEnv.useInMemory = true;
    mockUseGoogleAuth.mockReturnValue({ isAuthenticated: false, isRestoring: false });
    render(
      <RequireAuth>
        <div>protected</div>
      </RequireAuth>,
    );
    expect(screen.getByText('protected')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
