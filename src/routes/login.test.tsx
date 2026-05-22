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

// Mock the router navigate
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
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
    mockUseGoogleAuth.mockReturnValue({
      login: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('redirects to dashboard when useInMemory is true', () => {
    mockEnv.useInMemory = true;
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
