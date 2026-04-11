CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
	`restaurant_id` integer NOT NULL REFERENCES `restaurants`(`id`) ON DELETE CASCADE,
	`text` text NOT NULL,
	`rating` integer NOT NULL,
	`receipt_image_url` text NOT NULL,
	`receipt_total` integer,
	`receipt_date` text,
	`receipt_items_json` text,
	`receipt_establishment_name` text,
	`match_confidence` real,
	`status` text DEFAULT 'approved' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reviews_restaurant_idx` ON `reviews` (`restaurant_id`);
--> statement-breakpoint
CREATE INDEX `reviews_user_idx` ON `reviews` (`user_id`);
--> statement-breakpoint
CREATE INDEX `reviews_status_idx` ON `reviews` (`status`);
--> statement-breakpoint
CREATE TABLE `receipts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
	`restaurant_id` integer REFERENCES `restaurants`(`id`) ON DELETE SET NULL,
	`image_url` text NOT NULL,
	`total` integer,
	`date` text,
	`items_json` text,
	`establishment_name` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `receipts_user_idx` ON `receipts` (`user_id`);
