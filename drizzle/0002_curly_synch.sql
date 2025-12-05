CREATE UNIQUE INDEX `purchase_features_purchase_id_feature_id_unique` ON `purchase_features` (`purchase_id`,`feature_id`);--> statement-breakpoint
CREATE INDEX `idx_purchase_id` ON `purchase_features` (`purchase_id`);--> statement-breakpoint
CREATE INDEX `idx_feature_id` ON `purchase_features` (`feature_id`);--> statement-breakpoint
CREATE INDEX `idx_product_id` ON `purchases` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_is_synced` ON `purchases` (`is_synced`);