CREATE TABLE `data_connections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`provider` text NOT NULL,
	`status` text DEFAULT 'connected' NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text DEFAULT '' NOT NULL,
	`expires_at` integer DEFAULT 0 NOT NULL,
	`account_label` text DEFAULT '' NOT NULL,
	`property_id` text DEFAULT '' NOT NULL,
	`metrics` text DEFAULT '{}' NOT NULL,
	`last_synced_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
