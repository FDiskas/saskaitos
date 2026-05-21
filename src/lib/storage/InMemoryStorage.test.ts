import { runStorageContract } from './_storageContract';
import { InMemoryStorage } from './InMemoryStorage';

runStorageContract({
  name: 'InMemoryStorage',
  create: () => new InMemoryStorage(),
});
