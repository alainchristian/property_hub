import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1775726453830 implements MigrationInterface {
    name = 'InitialSchema1775726453830'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('owner', 'manager', 'tenant', 'vendor', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'tenant', "first_name" character varying, "last_name" character varying, "phone" character varying, "is_active" boolean NOT NULL DEFAULT true, "refresh_token" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."properties_type_enum" AS ENUM('residential', 'commercial', 'mixed')`);
        await queryRunner.query(`CREATE TABLE "properties" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_id" uuid NOT NULL, "name" character varying NOT NULL, "address" text NOT NULL, "type" "public"."properties_type_enum" NOT NULL DEFAULT 'residential', "description" text, "acquisition_date" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2d83bfa0b9fcd45dee1785af44d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying NOT NULL, "address" character varying, "id_number" character varying, "emergency_contact_name" character varying, "emergency_contact_phone" character varying, "user_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_155c343439adc83ada6ee3f48be" UNIQUE ("email"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_method_enum" AS ENUM('online', 'cash', 'bank_transfer', 'mobile_money', 'check')`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'paid', 'overdue', 'partial')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lease_id" uuid NOT NULL, "due_date" date NOT NULL, "amount_due" numeric(12,2) NOT NULL, "amount_paid" numeric(12,2) NOT NULL DEFAULT '0', "payment_date" TIMESTAMP, "method" "public"."payments_method_enum", "late_fee" numeric(10,2) NOT NULL DEFAULT '0', "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "stripe_payment_intent_id" character varying, "receipt_number" character varying, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."leases_payment_schedule_enum" AS ENUM('monthly', 'quarterly', 'yearly')`);
        await queryRunner.query(`CREATE TYPE "public"."leases_status_enum" AS ENUM('pending', 'active', 'expired', 'terminated')`);
        await queryRunner.query(`CREATE TABLE "leases" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "unit_id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "rent_amount" numeric(12,2) NOT NULL, "deposit_amount" numeric(12,2) NOT NULL, "payment_schedule" "public"."leases_payment_schedule_enum" NOT NULL DEFAULT 'monthly', "payment_day" integer NOT NULL DEFAULT '1', "status" "public"."leases_status_enum" NOT NULL DEFAULT 'pending', "termination_reason" text, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2668e338ab2d27079170ea55ea2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."units_type_enum" AS ENUM('residential', 'commercial', 'office', 'warehouse', 'retail', 'mixed')`);
        await queryRunner.query(`CREATE TYPE "public"."units_status_enum" AS ENUM('vacant', 'occupied', 'maintenance')`);
        await queryRunner.query(`CREATE TABLE "units" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "property_id" uuid NOT NULL, "unit_number" character varying NOT NULL, "type" "public"."units_type_enum" NOT NULL DEFAULT 'residential', "floor" integer, "area" numeric(10,2), "rent_amount" numeric(12,2) NOT NULL, "status" "public"."units_status_enum" NOT NULL DEFAULT 'vacant', "description" text, CONSTRAINT "PK_5a8f2f064919b587d93936cb223" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_775085c1f14fcfa208160ace4e" ON "units" ("property_id", "unit_number") `);
        await queryRunner.query(`CREATE TYPE "public"."maintenance_requests_category_enum" AS ENUM('plumbing', 'electrical', 'hvac', 'structural', 'cleaning', 'security', 'general')`);
        await queryRunner.query(`CREATE TYPE "public"."maintenance_requests_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`);
        await queryRunner.query(`CREATE TYPE "public"."maintenance_requests_status_enum" AS ENUM('submitted', 'assigned', 'in_progress', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "maintenance_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "unit_id" uuid NOT NULL, "tenant_id" uuid, "vendor_id" uuid, "description" text NOT NULL, "category" "public"."maintenance_requests_category_enum" NOT NULL DEFAULT 'general', "priority" "public"."maintenance_requests_priority_enum" NOT NULL DEFAULT 'medium', "status" "public"."maintenance_requests_status_enum" NOT NULL DEFAULT 'submitted', "estimated_cost" numeric(10,2), "actual_cost" numeric(10,2), "resolution_notes" text, "completed_at" TIMESTAMP, "attachments" jsonb NOT NULL DEFAULT '[]', "submitted_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c1521eb67c471accae8c531f9fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vendors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_name" character varying NOT NULL, "contact_name" character varying NOT NULL, "phone" character varying NOT NULL, "email" character varying NOT NULL, "services_offered" jsonb NOT NULL DEFAULT '[]', "hourly_rate" numeric(10,2), "notes" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_3fe1343dbf2a7d9b7be1c27725a" UNIQUE ("email"), CONSTRAINT "PK_9c956c9797edfae5c6ddacc4e6e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."documents_ref_type_enum" AS ENUM('property', 'unit', 'lease', 'payment', 'maintenance', 'tenant')`);
        await queryRunner.query(`CREATE TABLE "documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ref_type" "public"."documents_ref_type_enum" NOT NULL, "ref_id" character varying NOT NULL, "file_name" character varying NOT NULL, "file_path" character varying NOT NULL, "file_size" bigint NOT NULL, "mime_type" character varying NOT NULL, "version" integer NOT NULL DEFAULT '1', "uploaded_by" character varying NOT NULL, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "FK_797b76e2d11a5bf755127d1aa67" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_72fae2ace901fdd43c82702c860" FOREIGN KEY ("lease_id") REFERENCES "leases"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leases" ADD CONSTRAINT "FK_74490d0e8132cb49ede07d898c7" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leases" ADD CONSTRAINT "FK_b4787e839c9c76e31d5a06aa3c5" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "units" ADD CONSTRAINT "FK_f221e6d7bfd686266003b982b5f" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "maintenance_requests" ADD CONSTRAINT "FK_5bc3ad3c2007fa9e7f3fe1ee3cb" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "maintenance_requests" ADD CONSTRAINT "FK_42bdf962a8e2790aaed83797574" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "maintenance_requests" ADD CONSTRAINT "FK_cf9b378962c45d7e7a5ffe74396" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "maintenance_requests" DROP CONSTRAINT "FK_cf9b378962c45d7e7a5ffe74396"`);
        await queryRunner.query(`ALTER TABLE "maintenance_requests" DROP CONSTRAINT "FK_42bdf962a8e2790aaed83797574"`);
        await queryRunner.query(`ALTER TABLE "maintenance_requests" DROP CONSTRAINT "FK_5bc3ad3c2007fa9e7f3fe1ee3cb"`);
        await queryRunner.query(`ALTER TABLE "units" DROP CONSTRAINT "FK_f221e6d7bfd686266003b982b5f"`);
        await queryRunner.query(`ALTER TABLE "leases" DROP CONSTRAINT "FK_b4787e839c9c76e31d5a06aa3c5"`);
        await queryRunner.query(`ALTER TABLE "leases" DROP CONSTRAINT "FK_74490d0e8132cb49ede07d898c7"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_72fae2ace901fdd43c82702c860"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_797b76e2d11a5bf755127d1aa67"`);
        await queryRunner.query(`DROP TABLE "documents"`);
        await queryRunner.query(`DROP TYPE "public"."documents_ref_type_enum"`);
        await queryRunner.query(`DROP TABLE "vendors"`);
        await queryRunner.query(`DROP TABLE "maintenance_requests"`);
        await queryRunner.query(`DROP TYPE "public"."maintenance_requests_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."maintenance_requests_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."maintenance_requests_category_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_775085c1f14fcfa208160ace4e"`);
        await queryRunner.query(`DROP TABLE "units"`);
        await queryRunner.query(`DROP TYPE "public"."units_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."units_type_enum"`);
        await queryRunner.query(`DROP TABLE "leases"`);
        await queryRunner.query(`DROP TYPE "public"."leases_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."leases_payment_schedule_enum"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
        await queryRunner.query(`DROP TABLE "properties"`);
        await queryRunner.query(`DROP TYPE "public"."properties_type_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
