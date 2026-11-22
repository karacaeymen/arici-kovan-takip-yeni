import { getDatabase, type LocalDatabase } from '../db/client';

import { createApiaryRepository } from './ApiaryRepository';
import { createBusinessRepository } from './BusinessRepository';
import { createFeedingRepository } from './FeedingRepository';
import { createHarvestRepository } from './HarvestRepository';
import { createHiveRepository } from './HiveRepository';
import { createInspectionRepository } from './InspectionRepository';
import { createOutboxRepository } from './OutboxRepository';
import { createQueenRepository } from './QueenRepository';
import { createRelocationRepository } from './RelocationRepository';
import { createSyncStateRepository } from './SyncStateRepository';
import { createTaskRepository } from './TaskRepository';
import { createTreatmentRepository } from './TreatmentRepository';
import type { RepositoryClock } from './syncedRepository';

// Repository'lerin tek kurulum noktası (TODO.md T1.6). Servisler veritabanını tanımaz;
// repository'leri buradan alır. Varlık repository'lerinin anahtarı tablo adıdır, böylece
// senkron motoru sunucudan gelen `{ table, row }` değişikliğini doğru repository'ye verir.

export function createRepositories(db: LocalDatabase, clock: RepositoryClock) {
  return {
    businesses: createBusinessRepository(db, clock),
    apiaries: createApiaryRepository(db, clock),
    hives: createHiveRepository(db, clock),
    queens: createQueenRepository(db, clock),
    inspections: createInspectionRepository(db, clock),
    treatments: createTreatmentRepository(db, clock),
    feedings: createFeedingRepository(db, clock),
    harvests: createHarvestRepository(db, clock),
    relocations: createRelocationRepository(db, clock),
    tasks: createTaskRepository(db, clock),
    outbox: createOutboxRepository(db),
    syncState: createSyncStateRepository(db),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;

let repositories: Repositories | undefined;

/** Telefondaki veritabanıyla çalışan repository'ler; ilk çağrıda kurulur. */
export function getRepositories(clock: RepositoryClock): Repositories {
  repositories ??= createRepositories(getDatabase(), clock);
  return repositories;
}

export type { OutboxChange, OutboxRepository } from './OutboxRepository';
export type { SyncState, SyncStateRepository } from './SyncStateRepository';
export type { RemoteApplyResult, RepositoryClock } from './syncedRepository';
