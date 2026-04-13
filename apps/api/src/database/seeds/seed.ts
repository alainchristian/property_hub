import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { databaseConfig } from '../../config/database.config';

config();

async function seed() {
  const dataSource = new DataSource(databaseConfig as any);
  await dataSource.initialize();

  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    console.log('Seeding database...');

    // ── 1. Users ──────────────────────────────────────────────────────────────
    const hash = await bcrypt.hash('password123', 10);

    const [owner] = await qr.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, 'owner', 'Alice', 'Morgan', '555-0001')
       RETURNING id`,
      ['owner@propertyhub.dev', hash],
    );
    const [manager] = await qr.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, 'manager', 'Bob', 'Singh', '555-0002')
       RETURNING id`,
      ['manager@propertyhub.dev', hash],
    );
    const [tUser1] = await qr.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name)
       VALUES ($1, $2, 'tenant', 'Carol', 'White')
       RETURNING id`,
      ['carol@example.com', hash],
    );
    const [tUser2] = await qr.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name)
       VALUES ($1, $2, 'tenant', 'David', 'Lee')
       RETURNING id`,
      ['david@example.com', hash],
    );
    await qr.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name)
       VALUES ($1, $2, 'vendor', 'Eve', 'Carter')
       RETURNING id`,
      ['vendor@propertyhub.dev', hash],
    );
    console.log('✓ Users');

    // ── 2. Vendors ────────────────────────────────────────────────────────────
    const [vendor1] = await qr.query(
      `INSERT INTO vendors (company_name, contact_name, phone, email, services_offered, hourly_rate)
       VALUES ('FixIt Plumbing', 'Frank Gill', '555-1001', 'frank@fixit.com', '["plumbing","general"]', 75.00)
       RETURNING id`,
    );
    await qr.query(
      `INSERT INTO vendors (company_name, contact_name, phone, email, services_offered, hourly_rate)
       VALUES ('PowerPro Electric', 'Grace Hall', '555-1002', 'grace@powerpro.com', '["electrical","hvac"]', 90.00)
       RETURNING id`,
    );
    await qr.query(
      `INSERT INTO vendors (company_name, contact_name, phone, email, services_offered, hourly_rate)
       VALUES ('CleanSweep Co', 'Henry Ford', '555-1003', 'henry@cleansweep.com', '["cleaning","general"]', 45.00)
       RETURNING id`,
    );
    console.log('✓ Vendors');

    // ── 3. Properties ─────────────────────────────────────────────────────────
    const [prop1] = await qr.query(
      `INSERT INTO properties (owner_id, name, address, type, description, acquisition_date)
       VALUES ($1, 'Sunset Residences', '42 Maple Avenue, Springfield', 'residential',
               'A modern 6-unit residential building', '2022-03-15')
       RETURNING id`,
      [owner.id],
    );
    const [prop2] = await qr.query(
      `INSERT INTO properties (owner_id, name, address, type, description, acquisition_date)
       VALUES ($1, 'Downtown Commerce Center', '10 Business Park Blvd, Springfield', 'commercial',
               'Mixed commercial space with retail and office units', '2023-07-01')
       RETURNING id`,
      [owner.id],
    );
    console.log('✓ Properties');

    // ── 4. Units (8 total) ────────────────────────────────────────────────────
    // Property 1 — residential (5 units)
    const [u1] = await qr.query(
      `INSERT INTO units (property_id, unit_number, type, floor, area, rent_amount, status)
       VALUES ($1, '101', 'residential', 1, 65.00, 1200.00, 'occupied') RETURNING id`,
      [prop1.id],
    );
    const [u2] = await qr.query(
      `INSERT INTO units (property_id, unit_number, type, floor, area, rent_amount, status)
       VALUES ($1, '102', 'residential', 1, 72.00, 1350.00, 'occupied') RETURNING id`,
      [prop1.id],
    );
    const [u3] = await qr.query(
      `INSERT INTO units (property_id, unit_number, type, floor, area, rent_amount, status)
       VALUES ($1, '201', 'residential', 2, 80.00, 1500.00, 'vacant') RETURNING id`,
      [prop1.id],
    );
    await qr.query(
      `INSERT INTO units (property_id, unit_number, type, floor, area, rent_amount, status)
       VALUES ($1, '202', 'residential', 2, 80.00, 1500.00, 'maintenance') RETURNING id`,
      [prop1.id],
    );
    await qr.query(
      `INSERT INTO units (property_id, unit_number, type, floor, area, rent_amount, status)
       VALUES ($1, '301', 'residential', 3, 95.00, 1800.00, 'vacant') RETURNING id`,
      [prop1.id],
    );
    // Property 2 — commercial (3 units)
    const [u5] = await qr.query(
      `INSERT INTO units (property_id, unit_number, type, floor, area, rent_amount, status)
       VALUES ($1, 'A1', 'retail', 0, 120.00, 2500.00, 'occupied') RETURNING id`,
      [prop2.id],
    );
    await qr.query(
      `INSERT INTO units (property_id, unit_number, type, floor, area, rent_amount, status)
       VALUES ($1, 'B1', 'office', 1, 85.00, 2000.00, 'vacant') RETURNING id`,
      [prop2.id],
    );
    await qr.query(
      `INSERT INTO units (property_id, unit_number, type, floor, area, rent_amount, status)
       VALUES ($1, 'B2', 'office', 1, 85.00, 2000.00, 'vacant') RETURNING id`,
      [prop2.id],
    );
    console.log('✓ Units');

    // ── 5. Tenants ────────────────────────────────────────────────────────────
    const [t1] = await qr.query(
      `INSERT INTO tenants (first_name, last_name, email, phone, user_id, id_number)
       VALUES ('Carol', 'White', 'carol.tenant@example.com', '555-2001', $1, 'ID-CW-001')
       RETURNING id`,
      [tUser1.id],
    );
    const [t2] = await qr.query(
      `INSERT INTO tenants (first_name, last_name, email, phone, user_id, id_number)
       VALUES ('David', 'Lee', 'david.tenant@example.com', '555-2002', $1, 'ID-DL-002')
       RETURNING id`,
      [tUser2.id],
    );
    const [t3] = await qr.query(
      `INSERT INTO tenants (first_name, last_name, email, phone, id_number)
       VALUES ('Emma', 'Stone', 'emma.stone@example.com', '555-2003', 'ID-ES-003')
       RETURNING id`,
    );
    const [t4] = await qr.query(
      `INSERT INTO tenants (first_name, last_name, email, phone, id_number)
       VALUES ('Frank', 'Ocean', 'frank.ocean@example.com', '555-2004', 'ID-FO-004')
       RETURNING id`,
    );
    console.log('✓ Tenants');

    // ── 6 & 7. Leases + Payments ──────────────────────────────────────────────

    // Lease 1 — Active (Carol in unit 101, Jan 2026 – Dec 2026)
    const [lease1] = await qr.query(
      `INSERT INTO leases (unit_id, tenant_id, start_date, end_date, rent_amount, deposit_amount,
                           payment_schedule, payment_day, status)
       VALUES ($1, $2, '2026-01-01', '2026-12-31', 1200.00, 2400.00, 'monthly', 1, 'active')
       RETURNING id`,
      [u1.id, t1.id],
    );
    const lease1Payments = buildMonthlySchedule(lease1.id, '2026-01-01', '2026-12-31', 1200, 1);
    for (const p of lease1Payments) {
      await qr.query(
        `INSERT INTO payments (lease_id, due_date, amount_due, amount_paid, payment_date, method,
                               late_fee, status, receipt_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [p.leaseId, p.dueDate, p.amountDue, p.amountPaid, p.paymentDate, p.method,
         p.lateFee, p.status, p.receiptNumber],
      );
    }

    // Lease 2 — Active (David in unit 102, Mar 2026 – Feb 2027)
    const [lease2] = await qr.query(
      `INSERT INTO leases (unit_id, tenant_id, start_date, end_date, rent_amount, deposit_amount,
                           payment_schedule, payment_day, status)
       VALUES ($1, $2, '2026-03-01', '2027-02-28', 1350.00, 2700.00, 'monthly', 1, 'active')
       RETURNING id`,
      [u2.id, t2.id],
    );
    const lease2Payments = buildMonthlySchedule(lease2.id, '2026-03-01', '2027-02-28', 1350, 1);
    for (const p of lease2Payments) {
      await qr.query(
        `INSERT INTO payments (lease_id, due_date, amount_due, amount_paid, payment_date, method,
                               late_fee, status, receipt_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [p.leaseId, p.dueDate, p.amountDue, p.amountPaid, p.paymentDate, p.method,
         p.lateFee, p.status, p.receiptNumber],
      );
    }

    // Lease 3 — Active (Emma in unit A1 commercial, Jan 2026 – Dec 2026)
    const [lease3] = await qr.query(
      `INSERT INTO leases (unit_id, tenant_id, start_date, end_date, rent_amount, deposit_amount,
                           payment_schedule, payment_day, status)
       VALUES ($1, $2, '2026-01-01', '2026-12-31', 2500.00, 5000.00, 'monthly', 5, 'active')
       RETURNING id`,
      [u5.id, t3.id],
    );
    const lease3Payments = buildMonthlySchedule(lease3.id, '2026-01-01', '2026-12-31', 2500, 5);
    for (const p of lease3Payments) {
      await qr.query(
        `INSERT INTO payments (lease_id, due_date, amount_due, amount_paid, payment_date, method,
                               late_fee, status, receipt_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [p.leaseId, p.dueDate, p.amountDue, p.amountPaid, p.paymentDate, p.method,
         p.lateFee, p.status, p.receiptNumber],
      );
    }

    // Lease 4 — Expired (Frank in unit 201, Jan 2025 – Dec 2025)
    const [lease4] = await qr.query(
      `INSERT INTO leases (unit_id, tenant_id, start_date, end_date, rent_amount, deposit_amount,
                           payment_schedule, payment_day, status)
       VALUES ($1, $2, '2025-01-01', '2025-12-31', 1500.00, 3000.00, 'monthly', 1, 'expired')
       RETURNING id`,
      [u3.id, t4.id],
    );
    const lease4Payments = buildExpiredSchedule(lease4.id, '2025-01-01', '2025-12-31', 1500, 1);
    for (const p of lease4Payments) {
      await qr.query(
        `INSERT INTO payments (lease_id, due_date, amount_due, amount_paid, payment_date, method,
                               late_fee, status, receipt_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [p.leaseId, p.dueDate, p.amountDue, p.amountPaid, p.paymentDate, p.method,
         p.lateFee, p.status, p.receiptNumber],
      );
    }
    console.log('✓ Leases + Payments');

    // ── 8. Maintenance Requests ───────────────────────────────────────────────
    await qr.query(
      `INSERT INTO maintenance_requests (unit_id, tenant_id, description, category, priority, status, submitted_at)
       VALUES ($1, $2, 'Kitchen faucet is dripping constantly', 'plumbing', 'medium', 'submitted', NOW())`,
      [u1.id, t1.id],
    );
    await qr.query(
      `INSERT INTO maintenance_requests (unit_id, tenant_id, vendor_id, description, category, priority,
                                         status, estimated_cost, actual_cost, resolution_notes, completed_at, submitted_at)
       VALUES ($1, $2, $3, 'Circuit breaker trips when using oven and microwave simultaneously',
               'electrical', 'high', 'completed', 150.00, 180.00,
               'Upgraded breaker panel for kitchen circuit', NOW() - interval '5 days', NOW() - interval '10 days')`,
      [u2.id, t2.id, vendor1.id],
    );
    await qr.query(
      `INSERT INTO maintenance_requests (unit_id, description, category, priority, status, submitted_at)
       VALUES ($1, 'AC unit not cooling below 26°C even on max setting', 'hvac', 'urgent', 'in_progress', NOW() - interval '2 days')`,
      [u5.id],
    );
    console.log('✓ Maintenance Requests');

    await qr.commitTransaction();
    console.log('\n✅ Seed complete.');
    console.log('\nCredentials (all passwords: password123):');
    console.log('  owner@propertyhub.dev   — Owner');
    console.log('  manager@propertyhub.dev — Manager');
    console.log('  carol@example.com       — Tenant user');
    console.log('  david@example.com       — Tenant user');
    console.log('  vendor@propertyhub.dev  — Vendor user');
  } catch (err) {
    await qr.rollbackTransaction();
    console.error('Seed failed, rolled back:', err);
    process.exit(1);
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

interface SeedPayment {
  leaseId: string;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  paymentDate: string | null;
  method: string | null;
  lateFee: number;
  status: string;
  receiptNumber: string | null;
}

/** Generate monthly payments for an active lease (today = 2026-04-09).
 *  Jan–Feb → PAID; Mar → OVERDUE; Apr onwards → PENDING */
function buildMonthlySchedule(
  leaseId: string,
  startDate: string,
  endDate: string,
  rent: number,
  paymentDay: number,
): SeedPayment[] {
  const payments: SeedPayment[] = [];
  const today = new Date('2026-04-09');
  const start = new Date(startDate);
  const end = new Date(endDate);

  let current = new Date(start.getFullYear(), start.getMonth(), paymentDay);
  // Advance to first due date at or after lease start
  while (current < start) {
    current.setMonth(current.getMonth() + 1);
  }

  let counter = 1;
  while (current <= end) {
    const dueDate = current.toISOString().split('T')[0];
    const isPast = current < today;
    const isRecent = current < new Date('2026-04-01');

    let status: string;
    let amountPaid = 0;
    let paymentDate: string | null = null;
    let method: string | null = null;
    let lateFee = 0;
    let receiptNumber: string | null = null;

    if (isRecent) {
      // Jan & Feb → PAID; Mar → OVERDUE
      const month = current.getMonth(); // 0=Jan, 1=Feb, 2=Mar
      if (month < 2) {
        // Jan, Feb — paid on time
        status = 'paid';
        amountPaid = rent;
        paymentDate = new Date(current.getFullYear(), current.getMonth(), paymentDay + 2)
          .toISOString()
          .split('T')[0];
        method = 'bank_transfer';
        receiptNumber = `REC-${leaseId.slice(0, 4).toUpperCase()}-${String(counter).padStart(3, '0')}`;
      } else {
        // Mar — overdue
        status = 'overdue';
        lateFee = +(rent * 0.05).toFixed(2);
      }
    } else if (isPast) {
      status = 'overdue';
      lateFee = +(rent * 0.05).toFixed(2);
    } else {
      status = 'pending';
    }

    payments.push({
      leaseId,
      dueDate,
      amountDue: rent,
      amountPaid,
      paymentDate,
      method,
      lateFee,
      status,
      receiptNumber,
    });

    current.setMonth(current.getMonth() + 1);
    counter++;
  }

  return payments;
}

/** Generate monthly payments for an expired 2025 lease — mix of PAID and OVERDUE */
function buildExpiredSchedule(
  leaseId: string,
  startDate: string,
  endDate: string,
  rent: number,
  paymentDay: number,
): SeedPayment[] {
  const payments: SeedPayment[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let current = new Date(start.getFullYear(), start.getMonth(), paymentDay);
  while (current < start) current.setMonth(current.getMonth() + 1);

  let counter = 1;
  while (current <= end) {
    const dueDate = current.toISOString().split('T')[0];
    // First 10 months paid, last 2 overdue
    const isPaid = counter <= 10;

    payments.push({
      leaseId,
      dueDate,
      amountDue: rent,
      amountPaid: isPaid ? rent : 0,
      paymentDate: isPaid
        ? new Date(current.getFullYear(), current.getMonth(), paymentDay + 3)
            .toISOString()
            .split('T')[0]
        : null,
      method: isPaid ? 'cash' : null,
      lateFee: isPaid ? 0 : +(rent * 0.05).toFixed(2),
      status: isPaid ? 'paid' : 'overdue',
      receiptNumber: isPaid
        ? `REC-${leaseId.slice(0, 4).toUpperCase()}-${String(counter).padStart(3, '0')}`
        : null,
    });

    current.setMonth(current.getMonth() + 1);
    counter++;
  }

  return payments;
}

seed();
