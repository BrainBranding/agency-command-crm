CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`website` text NOT NULL,
	`niche` text NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`stage` text DEFAULT 'lead' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `findings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`title` text NOT NULL,
	`evidence` text DEFAULT '' NOT NULL,
	`impact` text DEFAULT '' NOT NULL,
	`recommendation` text DEFAULT '' NOT NULL,
	`severity` text DEFAULT 'medium' NOT NULL,
	`confidence` text DEFAULT 'hypothesis' NOT NULL,
	`approval` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`title` text NOT NULL,
	`instructions` text DEFAULT '' NOT NULL,
	`definition_of_done` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'ready' NOT NULL,
	`due_date` text,
	`owner_role` text DEFAULT 'owner' NOT NULL
);
