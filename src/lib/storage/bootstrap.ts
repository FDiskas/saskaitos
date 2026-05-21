import type { Storage } from './Storage';
import { StoragePath } from './StoragePath';

export const APP_ROOT = 'Saskaitos_App';

const CLIENTS_FILE = 'clients.json';
const SETTINGS_FILE = 'settings.json';

const INITIAL_CLIENTS = { clients: [] as unknown[] };
const INITIAL_SETTINGS = {
  company: null,
  series: [] as unknown[],
  designPresets: [] as unknown[],
};

export async function ensureAppStructure(storage: Storage): Promise<void> {
  const existing = new Set((await storage.list(APP_ROOT)).map((e) => e.name));
  if (!existing.has(CLIENTS_FILE)) {
    await storage.write(StoragePath.of(APP_ROOT, CLIENTS_FILE), INITIAL_CLIENTS);
  }
  if (!existing.has(SETTINGS_FILE)) {
    await storage.write(StoragePath.of(APP_ROOT, SETTINGS_FILE), INITIAL_SETTINGS);
  }
}
