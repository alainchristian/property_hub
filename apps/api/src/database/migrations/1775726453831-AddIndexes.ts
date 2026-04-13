import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexes1775726453831 implements MigrationInterface {
  name = 'AddIndexes1775726453831';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Payments — used by overdue-check, rent-reminder processors
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_lease_status" ON "payments" ("lease_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_due_date_status" ON "payments" ("due_date", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_status" ON "payments" ("status")`,
    );

    // Leases — used by lease-expiry processor and business logic
    await queryRunner.query(
      `CREATE INDEX "IDX_leases_unit_status" ON "leases" ("unit_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_leases_tenant_status" ON "leases" ("tenant_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_leases_end_date_status" ON "leases" ("end_date", "status")`,
    );

    // Maintenance requests — filtered by unit and tenant
    await queryRunner.query(
      `CREATE INDEX "IDX_maintenance_unit_status" ON "maintenance_requests" ("unit_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_maintenance_tenant_status" ON "maintenance_requests" ("tenant_id", "status")`,
    );

    // Documents — polymorphic lookup
    await queryRunner.query(
      `CREATE INDEX "IDX_documents_ref" ON "documents" ("ref_type", "ref_id")`,
    );

    // Properties — lookup by owner
    await queryRunner.query(
      `CREATE INDEX "IDX_properties_owner" ON "properties" ("owner_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_properties_owner"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_documents_ref"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_maintenance_tenant_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_maintenance_unit_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_leases_end_date_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_leases_tenant_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_leases_unit_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payments_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payments_due_date_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payments_lease_status"`);
  }
}
