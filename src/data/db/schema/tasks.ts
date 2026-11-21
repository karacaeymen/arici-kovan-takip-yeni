import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { TaskSource, TaskStatus } from '../../../domain/entities/task';

import { ownedColumns } from './columns';

export const tasks = sqliteTable(
  'tasks',
  {
    ...ownedColumns(),
    apiaryId: text('apiary_id'),
    hiveId: text('hive_id'),
    source: text('source').notNull().$type<TaskSource>(),
    ruleId: text('rule_id'),
    dedupKey: text('dedup_key'),
    title: text('title').notNull(),
    dueOn: text('due_on').notNull(),
    status: text('status').notNull().$type<TaskStatus>(),
    completedAt: text('completed_at'),
    snoozedUntil: text('snoozed_until'),
    notes: text('notes'),
  },
  (t) => [
    index('tasks_business_id_idx').on(t.businessId),
    index('tasks_due_on_idx').on(t.dueOn),
    index('tasks_dedup_key_idx').on(t.dedupKey),
  ],
);

export type TaskRow = typeof tasks.$inferSelect;
export type NewTaskRow = typeof tasks.$inferInsert;
