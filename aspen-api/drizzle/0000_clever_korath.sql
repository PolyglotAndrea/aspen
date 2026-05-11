CREATE TABLE "admins" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text,
	"role" text DEFAULT 'admin' NOT NULL,
	"avatar" text,
	"status" text DEFAULT 'active',
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "brand_data" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"video_url" text,
	"tagline" text,
	"stories" jsonb,
	CONSTRAINT "brand_data_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"member_id" text NOT NULL,
	"product_id" text NOT NULL,
	"product_name" text NOT NULL,
	"product_image" text,
	"spec" text,
	"price" real NOT NULL,
	"quantity" integer NOT NULL,
	"stock" integer NOT NULL,
	CONSTRAINT "cart_unique" UNIQUE("tenant_id","member_id","product_id","spec")
);
--> statement-breakpoint
CREATE TABLE "delivery_menu_items" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"subtitle" text,
	"description" text,
	"price" real NOT NULL,
	"original_price" real,
	"image" text,
	"images" jsonb,
	"category" text NOT NULL,
	"available" boolean DEFAULT true,
	"stock" integer DEFAULT 999,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"specs" jsonb,
	"is_recommend" boolean DEFAULT false,
	"is_new" boolean DEFAULT false,
	"sold_count" integer DEFAULT 0,
	"rating" real DEFAULT 0,
	"sort" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"member_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "member_target_unique" UNIQUE("member_id","target_type","target_id")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"phone" text NOT NULL,
	"username" text,
	"password_hash" text,
	"nickname" text,
	"avatar" text,
	"level_id" text DEFAULT 'bronze',
	"points" integer DEFAULT 0,
	"total_points" integer DEFAULT 0,
	"balance" real DEFAULT 0,
	"status" text DEFAULT 'active',
	"birthday" text,
	"last_consume_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tenant_phone_unique" UNIQUE("tenant_id","phone")
);
--> statement-breakpoint
CREATE TABLE "menu_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"image" text,
	"description" text,
	"sort" integer DEFAULT 0,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"category_id" text,
	"name" text NOT NULL,
	"subtitle" text,
	"price" real NOT NULL,
	"original_price" real,
	"description" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"image_url" text,
	"images" jsonb,
	"is_recommend" boolean DEFAULT false,
	"is_new" boolean DEFAULT false,
	"is_hot" boolean DEFAULT false,
	"available" boolean DEFAULT true,
	"sold_count" integer DEFAULT 0,
	"rating" real DEFAULT 0,
	"sort" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"product_name" text NOT NULL,
	"product_image" text,
	"spec" text,
	"price" real NOT NULL,
	"quantity" integer NOT NULL,
	"subtotal" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"type" text NOT NULL,
	"order_no" text NOT NULL,
	"member_id" text,
	"store_id" text,
	"status" text DEFAULT 'pending',
	"subtotal" real NOT NULL,
	"delivery_fee" real,
	"packaging_fee" real,
	"discount" real DEFAULT 0,
	"points_used" integer,
	"points_amount" real,
	"total" real NOT NULL,
	"paid_amount" real,
	"payment_method" text,
	"paid_at" timestamp with time zone,
	"booking_info" jsonb,
	"delivery_info" jsonb,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	CONSTRAINT "orders_order_no_unique" UNIQUE("order_no")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"order_id" text NOT NULL,
	"transaction_no" text NOT NULL,
	"channel" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'pending',
	"paid_at" timestamp with time zone,
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "payments_transaction_no_unique" UNIQUE("transaction_no")
);
--> statement-breakpoint
CREATE TABLE "points_records" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"member_id" text NOT NULL,
	"points" integer NOT NULL,
	"balance" integer NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"order_id" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"image" text,
	"description" text,
	"parent_id" text,
	"sort" integer DEFAULT 0,
	"enabled" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "product_skus" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"price" real NOT NULL,
	"stock" integer DEFAULT 999,
	"sort" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"category_id" text NOT NULL,
	"name" text NOT NULL,
	"subtitle" text,
	"description" text,
	"images" jsonb,
	"video_url" text,
	"price" real NOT NULL,
	"original_price" real,
	"stock" integer DEFAULT 999,
	"unit" text,
	"specs" jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_recommend" boolean DEFAULT false,
	"is_new" boolean DEFAULT false,
	"is_hot" boolean DEFAULT false,
	"sort" integer DEFAULT 0,
	"status" text DEFAULT 'active',
	"sold_count" integer DEFAULT 0,
	"rating" real DEFAULT 0,
	"rating_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"address" text NOT NULL,
	"phone" text NOT NULL,
	"longitude" real,
	"latitude" real,
	"business_hours" jsonb,
	"rating" real DEFAULT 0,
	"rating_count" integer DEFAULT 0,
	"monthly_sales" integer DEFAULT 0,
	"min_order_amount" real DEFAULT 0,
	"delivery_fee" real DEFAULT 0,
	"delivery_distance" real DEFAULT 5,
	"pack_price" real DEFAULT 0,
	"notice" text,
	"qr_code" text,
	"is_open" boolean DEFAULT true,
	"features" jsonb DEFAULT '{}'::jsonb,
	"images" jsonb,
	"description" text,
	"status" text DEFAULT 'active',
	"sort" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tables" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"store_id" text NOT NULL,
	"name" text NOT NULL,
	"capacity" integer NOT NULL,
	"position" text,
	"type" text DEFAULT 'indoor',
	"available" boolean DEFAULT true,
	"price" real
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_name" text NOT NULL,
	"brand_name_en" text,
	"config" jsonb NOT NULL,
	"status" text DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_records" ADD CONSTRAINT "points_records_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_skus" ADD CONSTRAINT "product_skus_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tables" ADD CONSTRAINT "tables_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;