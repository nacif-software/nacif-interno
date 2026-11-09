-- Torna project_id e cover_id opcionais. O SQLite não altera NOT NULL, então a tabela é recriada.
-- Cuidado com FKs ativas (D1): DROP ou RENAME de `communications` com filhas penduradas dispara o
-- ON DELETE CASCADE ou reescreve as referências (testado localmente: apagou decisions e flow_events).
-- Por isso as filhas também são recriadas apontando para a tabela nova; nenhum DROP acontece com
-- uma filha ainda referenciando a tabela apagada.
PRAGMA defer_foreign_keys = on;--> statement-breakpoint
CREATE TABLE `__new_communications` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`year` integer NOT NULL,
	`sequence` integer NOT NULL,
	`author_id` text NOT NULL,
	`project_id` text,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`business_days` integer NOT NULL,
	`deducted_days` integer,
	`cover_id` text,
	`approver_id` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'IN_REVIEW' NOT NULL,
	`submitted_at` text NOT NULL,
	`cancelled_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cover_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "communications_status_check" CHECK(status in ('IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'))
);--> statement-breakpoint
INSERT INTO `__new_communications`("id", "code", "year", "sequence", "author_id", "project_id", "start_date", "end_date", "business_days", "deducted_days", "cover_id", "approver_id", "notes", "status", "submitted_at", "cancelled_at", "created_at", "updated_at") SELECT "id", "code", "year", "sequence", "author_id", "project_id", "start_date", "end_date", "business_days", "deducted_days", "cover_id", "approver_id", "notes", "status", "submitted_at", "cancelled_at", "created_at", "updated_at" FROM `communications`;--> statement-breakpoint
CREATE TABLE `__new_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`communication_id` text NOT NULL,
	`type` text NOT NULL,
	`decider_id` text NOT NULL,
	`decided_at` text NOT NULL,
	`justification` text,
	`batch_id` text,
	`reverted_at` text,
	FOREIGN KEY (`communication_id`) REFERENCES `__new_communications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`decider_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`batch_id`) REFERENCES `approval_batches`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "decisions_type_check" CHECK(type in ('APPROVED', 'REJECTED'))
);--> statement-breakpoint
INSERT INTO `__new_decisions` SELECT * FROM `decisions`;--> statement-breakpoint
CREATE TABLE `__new_flow_events` (
	`id` text PRIMARY KEY NOT NULL,
	`communication_id` text NOT NULL,
	`type` text NOT NULL,
	`actor_id` text,
	`occurred_at` text NOT NULL,
	`description` text NOT NULL,
	`metadata` text,
	FOREIGN KEY (`communication_id`) REFERENCES `__new_communications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "flow_events_type_check" CHECK(type in ('SUBMITTED', 'IN_REVIEW', 'DECISION', 'CANCELLED', 'EDITED', 'DECISION_REVERTED'))
);--> statement-breakpoint
INSERT INTO `__new_flow_events` SELECT * FROM `flow_events`;--> statement-breakpoint
DROP TABLE `flow_events`;--> statement-breakpoint
DROP TABLE `decisions`;--> statement-breakpoint
DROP TABLE `communications`;--> statement-breakpoint
ALTER TABLE `__new_communications` RENAME TO `communications`;--> statement-breakpoint
ALTER TABLE `__new_decisions` RENAME TO `decisions`;--> statement-breakpoint
ALTER TABLE `__new_flow_events` RENAME TO `flow_events`;--> statement-breakpoint
CREATE UNIQUE INDEX `communications_code_key` ON `communications` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `communications_year_sequence_key` ON `communications` (`year`,`sequence`);--> statement-breakpoint
CREATE INDEX `communications_author_id_submitted_at_idx` ON `communications` (`author_id`,`submitted_at`);--> statement-breakpoint
CREATE INDEX `communications_approver_id_status_submitted_at_idx` ON `communications` (`approver_id`,`status`,`submitted_at`);--> statement-breakpoint
CREATE INDEX `communications_project_id_status_start_date_end_date_idx` ON `communications` (`project_id`,`status`,`start_date`,`end_date`);--> statement-breakpoint
CREATE INDEX `communications_status_start_date_end_date_idx` ON `communications` (`status`,`start_date`,`end_date`);--> statement-breakpoint
CREATE INDEX `communications_author_id_status_idx` ON `communications` (`author_id`,`status`);--> statement-breakpoint
CREATE INDEX `decisions_communication_id_decided_at_idx` ON `decisions` (`communication_id`,`decided_at`);--> statement-breakpoint
CREATE INDEX `decisions_batch_id_idx` ON `decisions` (`batch_id`);--> statement-breakpoint
CREATE INDEX `flow_events_communication_id_occurred_at_idx` ON `flow_events` (`communication_id`,`occurred_at`);
