CREATE TABLE `purchase_features` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purchase_id` integer NOT NULL,
	`feature_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE CASCADE,
	UNIQUE (`purchase_id`, `feature_id`)
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`transaction_id` text NOT NULL,
	`product_id` text NOT NULL,
	`purchased_at` integer NOT NULL,
	`price` real NOT NULL,
	`currency_code` text NOT NULL,
	`is_verified` integer DEFAULT false,
	`is_synced` integer DEFAULT false,
	`synced_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_transaction_id_unique` ON `purchases` (`transaction_id`);