ALTER TABLE "products" ALTER COLUMN "min_stock" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "min_stock" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "current_stock" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "current_stock" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "stock_movements" ALTER COLUMN "quantity" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "units_per_bulk" numeric(12, 2) DEFAULT '1';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "margin_pct" numeric(5, 2) DEFAULT '0';