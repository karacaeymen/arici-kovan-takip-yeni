CREATE TABLE `businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `apiaries` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`name` text NOT NULL,
	`climate_profile_code` text,
	`latitude` real,
	`longitude` real,
	`location_source` text,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `apiaries_business_id_idx` ON `apiaries` (`business_id`);--> statement-breakpoint
CREATE TABLE `hives` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`apiary_id` text NOT NULL,
	`number` integer NOT NULL,
	`name` text,
	`status` text NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `hives_business_id_idx` ON `hives` (`business_id`);--> statement-breakpoint
CREATE INDEX `hives_apiary_id_idx` ON `hives` (`apiary_id`);--> statement-breakpoint
CREATE TABLE `queens` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`hive_id` text NOT NULL,
	`birth_year` integer,
	`is_marked` integer NOT NULL,
	`origin` text NOT NULL,
	`introduced_on` text NOT NULL,
	`ended_on` text,
	`end_reason` text,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `queens_business_id_idx` ON `queens` (`business_id`);--> statement-breakpoint
CREATE INDEX `queens_hive_id_idx` ON `queens` (`hive_id`);--> statement-breakpoint
CREATE TABLE `inspections` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`hive_id` text NOT NULL,
	`session_id` text,
	`inspected_at` text NOT NULL,
	`bee_frames` integer,
	`brood_frames` integer,
	`honey_frames` integer,
	`queen_status` text,
	`varroa_method` text,
	`varroa_mite_count` integer,
	`varroa_sample_size` integer,
	`temperament` text,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `inspections_business_id_idx` ON `inspections` (`business_id`);--> statement-breakpoint
CREATE INDEX `inspections_hive_id_idx` ON `inspections` (`hive_id`);--> statement-breakpoint
CREATE TABLE `treatments` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`hive_id` text NOT NULL,
	`product_code` text NOT NULL,
	`started_on` text NOT NULL,
	`ended_on` text,
	`dose` text,
	`withdrawal_days` integer NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `treatments_business_id_idx` ON `treatments` (`business_id`);--> statement-breakpoint
CREATE INDEX `treatments_hive_id_idx` ON `treatments` (`hive_id`);--> statement-breakpoint
CREATE TABLE `feedings` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`hive_id` text NOT NULL,
	`fed_on` text NOT NULL,
	`feed_type` text NOT NULL,
	`amount` real NOT NULL,
	`unit` text NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `feedings_business_id_idx` ON `feedings` (`business_id`);--> statement-breakpoint
CREATE INDEX `feedings_hive_id_idx` ON `feedings` (`hive_id`);--> statement-breakpoint
CREATE TABLE `harvests` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`hive_id` text NOT NULL,
	`harvested_on` text NOT NULL,
	`frame_count` integer,
	`weight_kg` real,
	`withdrawal_warning_acknowledged` integer NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `harvests_business_id_idx` ON `harvests` (`business_id`);--> statement-breakpoint
CREATE INDEX `harvests_hive_id_idx` ON `harvests` (`hive_id`);--> statement-breakpoint
CREATE TABLE `relocations` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`hive_id` text NOT NULL,
	`from_apiary_id` text NOT NULL,
	`to_apiary_id` text NOT NULL,
	`moved_at` text NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `relocations_business_id_idx` ON `relocations` (`business_id`);--> statement-breakpoint
CREATE INDEX `relocations_hive_id_idx` ON `relocations` (`hive_id`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`apiary_id` text,
	`hive_id` text,
	`source` text NOT NULL,
	`rule_id` text,
	`dedup_key` text,
	`title` text NOT NULL,
	`due_on` text NOT NULL,
	`status` text NOT NULL,
	`completed_at` text,
	`snoozed_until` text,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `tasks_business_id_idx` ON `tasks` (`business_id`);--> statement-breakpoint
CREATE INDEX `tasks_due_on_idx` ON `tasks` (`due_on`);--> statement-breakpoint
CREATE INDEX `tasks_dedup_key_idx` ON `tasks` (`dedup_key`);--> statement-breakpoint
CREATE TABLE `outbox` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`table_name` text NOT NULL,
	`row_id` text NOT NULL,
	`payload` text NOT NULL,
	`enqueued_at` text NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`last_error` text
);
--> statement-breakpoint
CREATE INDEX `outbox_row_idx` ON `outbox` (`table_name`,`row_id`);--> statement-breakpoint
CREATE TABLE `sync_state` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`cursor` integer DEFAULT 0 NOT NULL,
	`last_synced_at` text,
	CONSTRAINT "sync_state_single_row" CHECK("sync_state"."id" = 1)
);
