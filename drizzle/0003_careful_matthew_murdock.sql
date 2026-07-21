CREATE TABLE `lead_outcomes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`occurred_at` text NOT NULL,
	`source` text DEFAULT 'unknown' NOT NULL,
	`contact_name` text DEFAULT '' NOT NULL,
	`stage` text DEFAULT 'lead' NOT NULL,
	`value` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
