import { z } from 'zod';

const EnvSchema = z.object({
  VITE_GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  VITE_USE_IN_MEMORY: z.string().optional(),
});

const parsed = EnvSchema.parse(import.meta.env);

export const env = {
  googleClientId: parsed.VITE_GOOGLE_CLIENT_ID ?? '',
  useInMemory: parsed.VITE_USE_IN_MEMORY === '1' || parsed.VITE_USE_IN_MEMORY === 'true',
} as const;
