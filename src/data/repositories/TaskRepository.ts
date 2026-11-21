import { and, asc, eq } from 'drizzle-orm';

import type { Task } from '../../domain/entities/task';
import type { LocalDatabase } from '../db/client';
import { tasks } from '../db/schema';

import { createSyncedRepository, type RepositoryClock } from './syncedRepository';

export function createTaskRepository(db: LocalDatabase, clock: RepositoryClock) {
  const base = createSyncedRepository<Task>(db, clock, { tableName: 'tasks', table: tasks });
  return {
    ...base,
    /** İşletmenin görevleri, tarihe göre (tamamlananlar dahil; filtreleme serviste). */
    watchByBusiness: (businessId: string) =>
      base.query(eq(tasks.businessId, businessId), [asc(tasks.dueOn), asc(tasks.createdAt)]),
    listByBusiness: (businessId: string) =>
      base.query(eq(tasks.businessId, businessId), [asc(tasks.dueOn), asc(tasks.createdAt)]).all(),
    /** Kovana ait görevler, tarihe göre. */
    watchByHive: (hiveId: string) =>
      base.query(eq(tasks.hiveId, hiveId), [asc(tasks.dueOn), asc(tasks.createdAt)]),
    /** Kural motorunun (T4.6) aynı öneriyi ikinci kez üretmemesi için tekilleştirme anahtarıyla arama. */
    findByDedupKey: (businessId: string, dedupKey: string) =>
      base.query(and(eq(tasks.businessId, businessId), eq(tasks.dedupKey, dedupKey))).all()[0],
  };
}

export type TaskRepository = ReturnType<typeof createTaskRepository>;
