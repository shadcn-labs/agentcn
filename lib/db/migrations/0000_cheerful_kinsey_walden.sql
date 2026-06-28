CREATE TABLE "account" (
	"access_token" text,
	"access_token_expires_at" timestamp,
	"account_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"id_token" text,
	"password" text,
	"provider_id" text NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_like" (
	"agent_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "agent_like_agent_id_user_id_pk" PRIMARY KEY("agent_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "agent_tag" (
	"agent_id" text NOT NULL,
	"tag" text NOT NULL,
	CONSTRAINT "agent_tag_agent_id_tag_pk" PRIMARY KEY("agent_id","tag")
);
--> statement-breakpoint
CREATE TABLE "community_agent" (
	"author_id" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"dependencies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description" text NOT NULL,
	"files" jsonb NOT NULL,
	"framework" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"title" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "community_agent_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"ip_address" text,
	"token" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"created_at" timestamp NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"image" text,
	"name" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"created_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"updated_at" timestamp,
	"value" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_like" ADD CONSTRAINT "agent_like_agent_id_community_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."community_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_like" ADD CONSTRAINT "agent_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tag" ADD CONSTRAINT "agent_tag_agent_id_community_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."community_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_agent" ADD CONSTRAINT "community_agent_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_like_unique_idx" ON "agent_like" USING btree ("agent_id","user_id");--> statement-breakpoint
CREATE INDEX "agent_like_user_idx" ON "agent_like" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_tag_tag_idx" ON "agent_tag" USING btree ("tag");--> statement-breakpoint
CREATE INDEX "community_agent_author_idx" ON "community_agent" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "community_agent_created_idx" ON "community_agent" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "community_agent_likes_idx" ON "community_agent" USING btree ("like_count");