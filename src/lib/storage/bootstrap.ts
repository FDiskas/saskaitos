import type { Storage } from './Storage';
import { StoragePath } from './StoragePath';
import { defaultSettings } from '@/lib/drive/settings';
import type { ClientsFileDto } from '@/lib/drive/schemas';

export const APP_ROOT = 'Saskaitos_App';
export const CLIENTS_FILE = 'clients.json';
export const SETTINGS_FILE = 'settings.json';

const INITIAL_CLIENTS: ClientsFileDto = { clients: [] };

export async function ensureAppStructure(storage: Storage): Promise<void> {
  const existing = new Set((await storage.list(APP_ROOT)).map((e) => e.name));
  if (!existing.has(CLIENTS_FILE)) {
    await storage.write(StoragePath.of(APP_ROOT, CLIENTS_FILE), INITIAL_CLIENTS);
  }
  if (!existing.has(SETTINGS_FILE)) {
    await storage.write(StoragePath.of(APP_ROOT, SETTINGS_FILE), defaultSettings());
  }
}
