import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginPage } from './login';

// Use vi.hoisted for variables that need to be accessed inside vi.mock
const { mockEnv } = vi.hoisted(() => {
  return {
    mockEnv: {
      useInMemory: false,
      googleClientId: '',
    },
  };
});

// Mock the router navigate + search
const mockNavigate = vi.fn();
const mockUseSearch = vi.fn<() => { from?: string }>(() => ({}));
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useSearch: () => mockUseSearch(),
}));

// Mock hooks
const mockUseGoogleAuth = vi.fn();
vi.mock('@/hooks', () => ({
  useGoogleAuth: () => mockUseGoogleAuth(),
}));

// Mock env using the hoisted variable
vi.mock('@/env', () => ({
  env: mockEnv,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearch.mockReturnValue({});
    mockUseGoogleAuth.mockReturnValue({
      login: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('when useInMemory true, redirects to dashboard', () => {
    mockEnv.useInMemory = true;
    render(<LoginPage />);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' });
  });

  it('when authenticated and no from param, redirects to dashboard', () => {
    mockEnv.useInMemory = false;
    mockEnv.googleClientId = '12345.apps.googleusercontent.com';
    mockUseGoogleAuth.mockReturnValue({
      login: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    render(<LoginPage />);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' });
  });

  it('when authenticated and from is local path, redirects to from', () => {
    mockEnv.useInMemory = false;
    mockEnv.googleClientId = '12345.apps.googleusercontent.com';
    mockUseSearch.mockReturnValue({ from: '/invoice-editor/abc?clientId=x' });
    mockUseGoogleAuth.mockReturnValue({
      login: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    render(<LoginPage />);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/invoice-editor/abc?clientId=x',
    });
  });

  it('when from looks like absolute url, ignores it and goes to dashboard', () => {
    mockEnv.useInMemory = false;
    mockEnv.googleClientId = '12345.apps.googleusercontent.com';
    mockUseSearch.mockReturnValue({ from: 'https://evil.example.com/' });
    mockUseGoogleAuth.mockReturnValue({
      login: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    render(<LoginPage />);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' });
  });

  it('when from is protocol-relative //evil.com, ignores it', () => {
    mockEnv.useInMemory = false;
    mockEnv.googleClientId = '12345.apps.googleusercontent.com';
    mockUseSearch.mockReturnValue({ from: '//evil.example.com/path' });
    mockUseGoogleAuth.mockReturnValue({
      login: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    render(<LoginPage />);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' });
  });

  it('shows warning and disables button when client ID is invalid and not in-memory', () => {
    mockEnv.useInMemory = false;
    mockEnv.googleClientId = 'GOCSPX-invalid-id';
    render(<LoginPage />);
    expect(screen.getByText(/Konfigūracijos įspėjimas:/)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Prisijungti su Google/ });
    expect(button).toBeDisabled();
  });

  it('does not show warning and enables button when client ID is valid', () => {
    mockEnv.useInMemory = false;
    mockEnv.googleClientId = '12345.apps.googleusercontent.com';
    render(<LoginPage />);
    expect(screen.queryByText(/Konfigūracijos įspėjimas:/)).not.toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Prisijungti su Google/ });
    expect(button).not.toBeDisabled();
  });
});
