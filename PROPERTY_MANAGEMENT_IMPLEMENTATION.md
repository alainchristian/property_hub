# Property Management System — Claude Code Implementation Guide

> **Purpose**: This document is a step-by-step build guide for Claude Code.  
> Read every section fully before executing any step. Each step references the previous one.  
> Do not skip steps. Do not proceed to the next step until the current one compiles and passes its checks.

---

## 0. Project Constraints & Decisions

| Concern | Decision |
|---|---|
| Containerization | **None** — all services run natively on host |
| Backend framework | **NestJS** (TypeScript, modular, built-in DI + guards) |
| Frontend framework | **React 18 + TypeScript + Vite** |
| Database | **PostgreSQL 16** (native install) |
| ORM | **TypeORM** with migration-based schema management |
| Auth | **JWT** (access token 15 min + refresh token 7 days) via Passport.js |
| Job queue | **Bull** + **Redis** (native install) |
| File uploads | **Multer** → local disk (`/uploads`) served via Nginx |
| Payments | **Stripe** (Checkout Sessions + Webhooks) |
| Email | **Nodemailer** (dev: SMTP; prod: SendGrid) |
| Styling | **Tailwind CSS v3** + **shadcn/ui** |
| State (client) | **TanStack Query v5** + React Context for auth |
| Forms | **React Hook Form** + **Zod** validation |
| Charts | **Recharts** |
| Operating System | **Windows 10/11** (all commands are PowerShell unless noted) |
| Process manager | **PM2** (production) |
| Web server | **Nginx for Windows** (nginx.org Windows binary, managed via NSSM) |
| Monorepo | **pnpm workspaces** |
| Testing | **Jest** + **Supertest** (API) · **Vitest** + **React Testing Library** (UI) |
| CI/CD | **GitHub Actions** → SSH deploy |

---

## 1. Prerequisites Verification

All commands below run in **PowerShell** (run as Administrator where noted).  
Install each missing tool before proceeding.

### 1.1 Install Required Tools (Windows)

| Tool | Download / Install |
|---|---|
| Node.js 20 LTS | https://nodejs.org → Windows Installer (.msi) |
| pnpm | `npm install -g pnpm` in PowerShell |
| PostgreSQL 16 | https://www.postgresql.org/download/windows/ → Interactive installer. During setup set password to `admin` and keep port `5432`. |
| Redis (Memurai) | https://www.memurai.com/get-memurai → Windows-native Redis-compatible server. Free Developer edition is sufficient for development. |
| Git | https://git-scm.com/download/win |
| Nginx for Windows | https://nginx.org/en/download.html → download the stable Windows zip, extract to `C:\nginx` |
| NSSM | https://nssm.cc/download → used to run Nginx as a Windows service |

### 1.2 Verify Installs

```powershell
# Run in PowerShell — all must return version numbers
node --version          # Expected: v20.x.x
pnpm --version          # Expected: 9.x.x
psql --version          # Expected: psql (PostgreSQL) 16.x
git --version

# Verify PostgreSQL service is running
Get-Service -Name postgresql*   # Status should be: Running

# Verify Memurai (Redis) service is running
Get-Service -Name Memurai       # Status should be: Running
# Test connectivity:
redis-cli ping                  # Expected: PONG
```

### 1.3 Add PostgreSQL bin to PATH

The PostgreSQL installer does not always add its tools to PATH automatically.

```powershell
# Add to system PATH (run as Administrator)
[Environment]::SetEnvironmentVariable(
  "Path",
  $env:Path + ";C:\Program Files\PostgreSQL\16\bin",
  [System.EnvironmentVariableTarget]::Machine
)
# Restart PowerShell after this for changes to take effect
```

---

## 2. Repository & Monorepo Scaffold

### 2.1 Initialize Git + pnpm workspace

```powershell
# Run in PowerShell
mkdir property-management
cd property-management
git init
git branch -M main

# Create pnpm workspace manifest
@"
packages:
  - 'apps/*'
  - 'packages/*'
"@ | Out-File -FilePath pnpm-workspace.yaml -Encoding utf8

# Create root package.json
@"
{
  "name": "property-management",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"pnpm --filter api dev\" \"pnpm --filter web dev\"",
    "build": "pnpm --filter api build && pnpm --filter web build",
    "test": "pnpm --filter api test && pnpm --filter web test",
    "migration:run": "pnpm --filter api migration:run",
    "migration:revert": "pnpm --filter api migration:revert",
    "seed": "pnpm --filter api seed"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
"@ | Out-File -FilePath package.json -Encoding utf8
```

### 2.2 Full directory structure to create

```
property-management/
├── apps/
│   ├── api/                          ← NestJS backend
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   └── jwt-refresh.strategy.ts
│   │   │   │   └── guards/
│   │   │   │       ├── jwt-auth.guard.ts
│   │   │   │       └── roles.guard.ts
│   │   │   ├── users/
│   │   │   ├── properties/
│   │   │   ├── units/
│   │   │   ├── tenants/
│   │   │   ├── leases/
│   │   │   ├── payments/
│   │   │   ├── maintenance/
│   │   │   ├── vendors/
│   │   │   ├── documents/
│   │   │   ├── reports/
│   │   │   ├── notifications/
│   │   │   │   ├── email.service.ts
│   │   │   │   ├── queues/
│   │   │   │   │   ├── rent-reminder.processor.ts
│   │   │   │   │   ├── overdue-check.processor.ts
│   │   │   │   │   └── lease-expiry.processor.ts
│   │   │   │   └── notifications.module.ts
│   │   │   ├── database/
│   │   │   │   ├── migrations/       ← TypeORM migration files
│   │   │   │   └── seeds/
│   │   │   │       └── seed.ts
│   │   │   ├── common/
│   │   │   │   ├── decorators/
│   │   │   │   │   ├── roles.decorator.ts
│   │   │   │   │   └── current-user.decorator.ts
│   │   │   │   ├── filters/
│   │   │   │   │   └── http-exception.filter.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   └── transform.interceptor.ts
│   │   │   │   └── pipes/
│   │   │   │       └── parse-uuid.pipe.ts
│   │   │   ├── config/
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── jwt.config.ts
│   │   │   │   └── stripe.config.ts
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/
│   │   ├── uploads/                  ← Runtime file storage (gitignored)
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── web/                          ← React frontend
│       ├── src/
│       │   ├── api/
│       │   │   ├── axios.ts          ← Axios instance with interceptors
│       │   │   ├── auth.api.ts
│       │   │   ├── properties.api.ts
│       │   │   ├── units.api.ts
│       │   │   ├── tenants.api.ts
│       │   │   ├── leases.api.ts
│       │   │   ├── payments.api.ts
│       │   │   ├── maintenance.api.ts
│       │   │   ├── vendors.api.ts
│       │   │   ├── documents.api.ts
│       │   │   └── reports.api.ts
│       │   ├── auth/
│       │   │   ├── AuthContext.tsx
│       │   │   ├── useAuth.ts
│       │   │   └── ProtectedRoute.tsx
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   ├── AppShell.tsx
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   └── TopBar.tsx
│       │   │   ├── ui/               ← shadcn/ui generated components
│       │   │   └── shared/
│       │   │       ├── DataTable.tsx
│       │   │       ├── StatusBadge.tsx
│       │   │       ├── ConfirmDialog.tsx
│       │   │       ├── FileUpload.tsx
│       │   │       └── PageHeader.tsx
│       │   ├── pages/
│       │   │   ├── auth/
│       │   │   │   ├── LoginPage.tsx
│       │   │   │   └── RegisterPage.tsx
│       │   │   ├── dashboard/
│       │   │   │   └── DashboardPage.tsx
│       │   │   ├── properties/
│       │   │   │   ├── PropertiesPage.tsx
│       │   │   │   ├── PropertyDetailPage.tsx
│       │   │   │   └── PropertyFormPage.tsx
│       │   │   ├── units/
│       │   │   │   ├── UnitsPage.tsx
│       │   │   │   ├── UnitDetailPage.tsx
│       │   │   │   └── UnitFormPage.tsx
│       │   │   ├── tenants/
│       │   │   │   ├── TenantsPage.tsx
│       │   │   │   ├── TenantDetailPage.tsx
│       │   │   │   └── TenantFormPage.tsx
│       │   │   ├── leases/
│       │   │   │   ├── LeasesPage.tsx
│       │   │   │   ├── LeaseDetailPage.tsx
│       │   │   │   └── LeaseFormPage.tsx
│       │   │   ├── payments/
│       │   │   │   ├── PaymentsPage.tsx
│       │   │   │   └── RecordPaymentPage.tsx
│       │   │   ├── maintenance/
│       │   │   │   ├── MaintenancePage.tsx
│       │   │   │   ├── MaintenanceDetailPage.tsx
│       │   │   │   └── MaintenanceFormPage.tsx
│       │   │   ├── vendors/
│       │   │   │   ├── VendorsPage.tsx
│       │   │   │   └── VendorFormPage.tsx
│       │   │   ├── reports/
│       │   │   │   └── ReportsPage.tsx
│       │   │   └── portal/
│       │   │       ├── TenantPortalPage.tsx
│       │   │       └── VendorPortalPage.tsx
│       │   ├── hooks/
│       │   │   ├── useProperties.ts
│       │   │   ├── useUnits.ts
│       │   │   ├── useTenants.ts
│       │   │   ├── useLeases.ts
│       │   │   ├── usePayments.ts
│       │   │   ├── useMaintenance.ts
│       │   │   └── useVendors.ts
│       │   ├── types/
│       │   │   └── index.ts          ← All shared TypeScript interfaces
│       │   ├── utils/
│       │   │   ├── formatters.ts     ← Currency, date, phone formatters
│       │   │   └── constants.ts
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── public/
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/
│       ├── src/
│       │   └── types.ts              ← Types shared between api and web
│       └── package.json
│
├── scripts/
│   └── setup-db.ps1                 ← PostgreSQL DB + user creation (PowerShell)
│
├── nginx/
│   └── property-mgmt.conf           ← Nginx site config
│
├── .github/
│   └── workflows/
│       └── deploy.yml               ← GitHub Actions CI/CD
│
├── .env.example                     ← Root-level env template
├── .gitignore
├── pnpm-workspace.yaml
└── package.json
```

### 2.3 .gitignore

```
node_modules/
dist/
.env
apps/api/uploads/*
!apps/api/uploads/.gitkeep
*.log
Thumbs.db
.DS_Store
coverage/
```

---

## 3. Environment Variables

### 3.1 `apps/api/.env.example`

```env
# App
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=property_mgmt
DB_USER=admin
DB_PASSWORD=admin

# JWT
JWT_SECRET=your_jwt_secret_minimum_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_minimum_32_chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email (dev: use Mailtrap or Gmail SMTP)
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_user
MAIL_PASS=your_mailtrap_password
MAIL_FROM=noreply@yourapp.com

# File uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10

# Frontend URL (for CORS and redirect)
FRONTEND_URL=http://localhost:5173
```

### 3.2 `apps/web/.env.example`

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3.3 Database Setup Script (`scripts/setup-db.ps1`)

This is a **PowerShell** script. Run it once to create the database and test database.  
Open PowerShell **as Administrator** and ensure `psql` is on your PATH (§1.3).

```powershell
# scripts/setup-db.ps1

$DB_NAME      = "property_mgmt"
$DB_TEST_NAME = "property_mgmt_test"
$DB_USER      = "admin"
$DB_PASS      = "admin"
$PGPASSWORD_ENV = $DB_PASS   # Used by psql to avoid interactive password prompt

$env:PGPASSWORD = $DB_PASS

Write-Host "Creating PostgreSQL user and databases..." -ForegroundColor Cyan

# Connect as the postgres superuser (password set during PostgreSQL installation)
# If your postgres superuser password differs, replace 'admin' below with it
$env:PGPASSWORD = "admin"

psql -U postgres -c @"
DO `$`$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS' SUPERUSER;
  END IF;
END
`$`$;
"@

psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Database '$DB_NAME' already exists — skipping." -ForegroundColor Yellow
} else {
  Write-Host "Database '$DB_NAME' created." -ForegroundColor Green
}

psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Test database
psql -U postgres -c "CREATE DATABASE $DB_TEST_NAME OWNER $DB_USER;" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Test database '$DB_TEST_NAME' already exists — skipping." -ForegroundColor Yellow
} else {
  Write-Host "Test database '$DB_TEST_NAME' created." -ForegroundColor Green
}

psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_TEST_NAME TO $DB_USER;"

Write-Host "Database setup complete." -ForegroundColor Green
```

Run with:

```powershell
# From the repo root, in PowerShell as Administrator
.\scripts\setup-db.ps1
```

Verify the databases were created:

```powershell
$env:PGPASSWORD = "admin"
psql -U admin -c "\l" postgres
# You should see property_mgmt and property_mgmt_test in the list
```

---

## 4. Backend — NestJS API

### 4.1 Initialize NestJS App

```powershell
# Run in PowerShell from the repo root
New-Item -ItemType Directory -Path apps\api -Force
cd apps\api
npx @nestjs/cli new . --package-manager pnpm --skip-git
cd ..\..
```

### 4.2 `apps/api/package.json` — Complete Dependencies

```json
{
  "name": "api",
  "version": "1.0.0",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "migration:generate": "typeorm-ts-node-commonjs migration:generate src/database/migrations/$npm_config_name -d src/config/database.config.ts",
    "migration:run": "typeorm-ts-node-commonjs migration:run -d src/config/database.config.ts",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/config/database.config.ts",
    "seed": "ts-node src/database/seeds/seed.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/config": "^3.2.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/typeorm": "^10.0.2",
    "@nestjs/bull": "^10.1.1",
    "@nestjs/schedule": "^4.0.1",
    "@nestjs/swagger": "^7.3.0",
    "typeorm": "^0.3.20",
    "pg": "^8.11.3",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "bull": "^4.12.2",
    "stripe": "^14.21.0",
    "nodemailer": "^6.9.13",
    "multer": "^1.4.5-lts.1",
    "reflect-metadata": "^0.2.1",
    "rxjs": "^7.8.1",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.2",
    "@nestjs/testing": "^10.3.0",
    "@types/bcrypt": "^5.0.2",
    "@types/jest": "^29.5.12",
    "@types/multer": "^1.4.11",
    "@types/nodemailer": "^6.4.14",
    "@types/passport-jwt": "^4.0.1",
    "@types/uuid": "^9.0.8",
    "jest": "^29.7.0",
    "supertest": "^6.3.4",
    "ts-jest": "^29.1.4",
    "ts-node": "^10.9.2",
    "typeorm-ts-node-commonjs": "^0.3.20",
    "typescript": "^5.4.2"
  }
}
```

### 4.3 `apps/api/src/config/database.config.ts`

```typescript
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

export const databaseConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'property_mgmt',
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,    // NEVER true in production — use migrations
  logging: process.env.NODE_ENV === 'development',
};

// Used by TypeORM CLI
export default new DataSource(databaseConfig);
```

### 4.4 TypeORM Entities

Create one file per entity. All entities live in their respective module folder as `<name>.entity.ts`.

#### `src/users/user.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Property } from '../properties/property.entity';

export enum UserRole {
  OWNER   = 'owner',
  MANAGER = 'manager',
  TENANT  = 'tenant',
  VENDOR  = 'vendor',
  ADMIN   = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.TENANT })
  role: UserRole;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken: string;

  @OneToMany(() => Property, (p) => p.owner)
  properties: Property[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### `src/properties/property.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Unit } from '../units/unit.entity';

export enum PropertyType {
  RESIDENTIAL = 'residential',
  COMMERCIAL  = 'commercial',
  MIXED       = 'mixed',
}

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User, (u) => u.properties)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column()
  name: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'enum', enum: PropertyType, default: PropertyType.RESIDENTIAL })
  type: PropertyType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'acquisition_date', type: 'date', nullable: true })
  acquisitionDate: Date;

  @OneToMany(() => Unit, (u) => u.property)
  units: Unit[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### `src/units/unit.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { Property } from '../properties/property.entity';
import { Lease } from '../leases/lease.entity';
import { MaintenanceRequest } from '../maintenance/maintenance-request.entity';

export enum UnitType {
  RESIDENTIAL = 'residential',
  COMMERCIAL  = 'commercial',
  OFFICE      = 'office',
  WAREHOUSE   = 'warehouse',
  RETAIL      = 'retail',
  MIXED       = 'mixed',
}

export enum UnitStatus {
  VACANT      = 'vacant',
  OCCUPIED    = 'occupied',
  MAINTENANCE = 'maintenance',
}

@Entity('units')
@Index(['propertyId', 'unitNumber'], { unique: true })
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'property_id' })
  propertyId: string;

  @ManyToOne(() => Property, (p) => p.units)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ name: 'unit_number' })
  unitNumber: string;

  @Column({ type: 'enum', enum: UnitType, default: UnitType.RESIDENTIAL })
  type: UnitType;

  @Column({ nullable: true })
  floor: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area: number;

  @Column({ name: 'rent_amount', type: 'decimal', precision: 12, scale: 2 })
  rentAmount: number;

  @Column({ type: 'enum', enum: UnitStatus, default: UnitStatus.VACANT })
  status: UnitStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => Lease, (l) => l.unit)
  leases: Lease[];

  @OneToMany(() => MaintenanceRequest, (m) => m.unit)
  maintenanceRequests: MaintenanceRequest[];
}
```

#### `src/tenants/tenant.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Lease } from '../leases/lease.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'id_number', nullable: true })
  idNumber: string;

  @Column({ name: 'emergency_contact_name', nullable: true })
  emergencyContactName: string;

  @Column({ name: 'emergency_contact_phone', nullable: true })
  emergencyContactPhone: string;

  // Linked user account (optional — tenant may or may not have login)
  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @OneToMany(() => Lease, (l) => l.tenant)
  leases: Lease[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### `src/leases/lease.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Unit } from '../units/unit.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Payment } from '../payments/payment.entity';

export enum LeaseStatus {
  PENDING    = 'pending',
  ACTIVE     = 'active',
  EXPIRED    = 'expired',
  TERMINATED = 'terminated',
}

export enum PaymentSchedule {
  MONTHLY   = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY    = 'yearly',
}

@Entity('leases')
export class Lease {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'unit_id' })
  unitId: string;

  @ManyToOne(() => Unit, (u) => u.leases)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, (t) => t.leases)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'rent_amount', type: 'decimal', precision: 12, scale: 2 })
  rentAmount: number;

  @Column({ name: 'deposit_amount', type: 'decimal', precision: 12, scale: 2 })
  depositAmount: number;

  @Column({
    name: 'payment_schedule',
    type: 'enum',
    enum: PaymentSchedule,
    default: PaymentSchedule.MONTHLY,
  })
  paymentSchedule: PaymentSchedule;

  @Column({ name: 'payment_day', default: 1 })
  paymentDay: number;   // Day of month rent is due (1–28)

  @Column({ type: 'enum', enum: LeaseStatus, default: LeaseStatus.PENDING })
  status: LeaseStatus;

  @Column({ name: 'termination_reason', type: 'text', nullable: true })
  terminationReason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => Payment, (p) => p.lease, { cascade: true })
  payments: Payment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### `src/payments/payment.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Lease } from '../leases/lease.entity';

export enum PaymentStatus {
  PENDING  = 'pending',
  PAID     = 'paid',
  OVERDUE  = 'overdue',
  PARTIAL  = 'partial',
}

export enum PaymentMethod {
  ONLINE        = 'online',
  CASH          = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY  = 'mobile_money',
  CHECK         = 'check',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lease_id' })
  leaseId: string;

  @ManyToOne(() => Lease, (l) => l.payments)
  @JoinColumn({ name: 'lease_id' })
  lease: Lease;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({ name: 'amount_due', type: 'decimal', precision: 12, scale: 2 })
  amountDue: number;

  @Column({ name: 'amount_paid', type: 'decimal', precision: 12, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ name: 'payment_date', type: 'timestamp', nullable: true })
  paymentDate: Date;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  method: PaymentMethod;

  @Column({ name: 'late_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  lateFee: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ name: 'stripe_payment_intent_id', nullable: true })
  stripePaymentIntentId: string;

  @Column({ name: 'receipt_number', nullable: true })
  receiptNumber: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

#### `src/maintenance/maintenance-request.entity.ts`

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Unit } from '../units/unit.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Vendor } from '../vendors/vendor.entity';

export enum MaintenancePriority {
  LOW    = 'low',
  MEDIUM = 'medium',
  HIGH   = 'high',
  URGENT = 'urgent',
}

export enum MaintenanceStatus {
  SUBMITTED   = 'submitted',
  ASSIGNED    = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED   = 'completed',
  CANCELLED   = 'cancelled',
}

export enum MaintenanceCategory {
  PLUMBING    = 'plumbing',
  ELECTRICAL  = 'electrical',
  HVAC        = 'hvac',
  STRUCTURAL  = 'structural',
  CLEANING    = 'cleaning',
  SECURITY    = 'security',
  GENERAL     = 'general',
}

@Entity('maintenance_requests')
export class MaintenanceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'unit_id' })
  unitId: string;

  @ManyToOne(() => Unit, (u) => u.maintenanceRequests)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ name: 'tenant_id', nullable: true })
  tenantId: string;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'vendor_id', nullable: true })
  vendorId: string;

  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: MaintenanceCategory, default: MaintenanceCategory.GENERAL })
  category: MaintenanceCategory;

  @Column({ type: 'enum', enum: MaintenancePriority, default: MaintenancePriority.MEDIUM })
  priority: MaintenancePriority;

  @Column({ type: 'enum', enum: MaintenanceStatus, default: MaintenanceStatus.SUBMITTED })
  status: MaintenanceStatus;

  @Column({ name: 'estimated_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost: number;

  @Column({ name: 'actual_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualCost: number;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes: string;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  // JSON array of file paths (photos/attachments)
  @Column({ type: 'jsonb', default: [] })
  attachments: string[];

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### `src/vendors/vendor.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { MaintenanceRequest } from '../maintenance/maintenance-request.entity';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_name' })
  companyName: string;

  @Column({ name: 'contact_name' })
  contactName: string;

  @Column()
  phone: string;

  @Column({ unique: true })
  email: string;

  // JSON array of service types (e.g., ['plumbing', 'hvac'])
  @Column({ name: 'services_offered', type: 'jsonb', default: [] })
  servicesOffered: string[];

  @Column({ name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => MaintenanceRequest, (m) => m.vendor)
  maintenanceRequests: MaintenanceRequest[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

#### `src/documents/document.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum DocumentRefType {
  PROPERTY    = 'property',
  UNIT        = 'unit',
  LEASE       = 'lease',
  PAYMENT     = 'payment',
  MAINTENANCE = 'maintenance',
  TENANT      = 'tenant',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ref_type', type: 'enum', enum: DocumentRefType })
  refType: DocumentRefType;

  @Column({ name: 'ref_id' })
  refId: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ default: 1 })
  version: number;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string;   // user.id

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;
}
```

---

## 5. Backend — Auth Module

### 5.1 DTOs

#### `src/auth/dto/register.dto.ts`

```typescript
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
```

#### `src/auth/dto/login.dto.ts`

```typescript
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

### 5.2 Auth Service (`src/auth/auth.service.ts`)

```typescript
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOneBy({ email: dto.email });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({ ...dto, passwordHash });
    await this.userRepo.save(user);

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOneBy({ email: dto.email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user || !user.refreshToken) throw new UnauthorizedException();

    const match = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!match) throw new UnauthorizedException();

    return this.generateTokens(user);
  }

  async logout(userId: string) {
    await this.userRepo.update(userId, { refreshToken: null });
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES', '7d'),
      }),
    ]);

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.update(user.id, { refreshToken: hashedRefresh });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }
}
```

### 5.3 Roles & Guards

#### `src/common/decorators/roles.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

#### `src/auth/guards/roles.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required) return true;

    const { user } = ctx.switchToHttp().getRequest();
    return required.includes(user?.role);
  }
}
```

---

## 6. Backend — Business Logic Services

### 6.1 Lease Service — Critical Methods (`src/leases/leases.service.ts`)

Implement all standard CRUD plus these business methods:

```typescript
// 1. On lease creation → auto-generate payment schedule
async createLeaseWithPayments(dto: CreateLeaseDto): Promise<Lease> {
  // a) Verify unit is vacant
  const unit = await this.unitRepo.findOneByOrFail({ id: dto.unitId });
  if (unit.status !== UnitStatus.VACANT) {
    throw new ConflictException('Unit is not available');
  }

  // b) Check no overlapping active lease exists
  const overlap = await this.leaseRepo.findOne({
    where: { unitId: dto.unitId, status: LeaseStatus.ACTIVE },
  });
  if (overlap) throw new ConflictException('Unit already has an active lease');

  // c) Create lease
  const lease = await this.leaseRepo.save(this.leaseRepo.create(dto));

  // d) Generate payment records for each cycle
  const payments = this.generatePaymentSchedule(lease);
  await this.paymentRepo.save(payments);

  // e) Mark unit as occupied
  await this.unitRepo.update(dto.unitId, { status: UnitStatus.OCCUPIED });

  return lease;
}

private generatePaymentSchedule(lease: Lease): Partial<Payment>[] {
  const payments: Partial<Payment>[] = [];
  const start = new Date(lease.startDate);
  const end = new Date(lease.endDate);

  let current = new Date(start.getFullYear(), start.getMonth(), lease.paymentDay);
  if (current < start) current.setMonth(current.getMonth() + 1);

  while (current <= end) {
    payments.push({
      leaseId: lease.id,
      dueDate: new Date(current),
      amountDue: lease.rentAmount,
      status: PaymentStatus.PENDING,
    });

    // Advance by payment schedule interval
    if (lease.paymentSchedule === PaymentSchedule.MONTHLY) {
      current.setMonth(current.getMonth() + 1);
    } else if (lease.paymentSchedule === PaymentSchedule.QUARTERLY) {
      current.setMonth(current.getMonth() + 3);
    } else {
      current.setFullYear(current.getFullYear() + 1);
    }
  }

  return payments;
}

// 2. Terminate lease
async terminateLease(id: string, reason: string): Promise<Lease> {
  const lease = await this.leaseRepo.findOneByOrFail({ id });
  await this.leaseRepo.update(id, {
    status: LeaseStatus.TERMINATED,
    terminationReason: reason,
  });
  // Cancel pending payments
  await this.paymentRepo.update(
    { leaseId: id, status: PaymentStatus.PENDING },
    { status: PaymentStatus.PENDING }, // keep as pending for audit; don't delete
  );
  // Free the unit
  await this.unitRepo.update(lease.unitId, { status: UnitStatus.VACANT });
  return this.leaseRepo.findOneByOrFail({ id });
}

// 3. Renew lease (creates a new lease entity)
async renewLease(id: string, dto: RenewLeaseDto): Promise<Lease> {
  const old = await this.leaseRepo.findOneByOrFail({ id });
  await this.leaseRepo.update(id, { status: LeaseStatus.EXPIRED });
  return this.createLeaseWithPayments({
    unitId: old.unitId,
    tenantId: old.tenantId,
    ...dto,
  });
}
```

### 6.2 Payment Service — Key Methods (`src/payments/payments.service.ts`)

```typescript
// Record an offline/manual payment
async recordPayment(id: string, dto: RecordPaymentDto): Promise<Payment> {
  const payment = await this.paymentRepo.findOneByOrFail({ id });
  const paid = Number(payment.amountPaid) + Number(dto.amountPaid);
  const due  = Number(payment.amountDue) + Number(payment.lateFee);

  const status = paid >= due
    ? PaymentStatus.PAID
    : PaymentStatus.PARTIAL;

  await this.paymentRepo.update(id, {
    amountPaid: paid,
    paymentDate: new Date(),
    method: dto.method,
    receiptNumber: dto.receiptNumber,
    status,
    notes: dto.notes,
  });

  return this.paymentRepo.findOneByOrFail({ id });
}

// Create Stripe checkout session for online payment
async createStripeCheckout(paymentId: string, tenantEmail: string) {
  const payment = await this.paymentRepo.findOneByOrFail({ id: paymentId });
  const totalCents = Math.round(
    (Number(payment.amountDue) + Number(payment.lateFee) - Number(payment.amountPaid)) * 100,
  );

  const session = await this.stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: tenantEmail,
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: totalCents,
        product_data: { name: `Rent Payment — Due ${payment.dueDate}` },
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${this.config.get('FRONTEND_URL')}/portal/payments?success=true`,
    cancel_url:  `${this.config.get('FRONTEND_URL')}/portal/payments?cancelled=true`,
    metadata: { paymentId },
  });

  return { url: session.url };
}

// Handle Stripe webhook
async handleStripeWebhook(payload: Buffer, sig: string) {
  const event = this.stripe.webhooks.constructEvent(
    payload, sig, this.config.get('STRIPE_WEBHOOK_SECRET'),
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentId = session.metadata.paymentId;
    await this.recordPayment(paymentId, {
      amountPaid: session.amount_total / 100,
      method: PaymentMethod.ONLINE,
      receiptNumber: session.payment_intent as string,
    });
  }
}
```

### 6.3 Background Jobs (`src/notifications/queues/`)

#### Overdue Check Processor

```typescript
@Processor('overdue-check')
export class OverdueCheckProcessor {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    private emailService: EmailService,
  ) {}

  @Process()
  async handleOverdue() {
    const LATE_FEE_RATE = 0.05; // 5% of amount due

    const overduePayments = await this.paymentRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.lease', 'lease')
      .leftJoinAndSelect('lease.tenant', 'tenant')
      .where('p.status = :status', { status: PaymentStatus.PENDING })
      .andWhere('p.due_date < NOW()')
      .getMany();

    for (const payment of overduePayments) {
      const lateFee = Number(payment.amountDue) * LATE_FEE_RATE;
      await this.paymentRepo.update(payment.id, {
        status: PaymentStatus.OVERDUE,
        lateFee,
      });

      await this.emailService.sendOverdueNotice(
        payment.lease.tenant.email,
        {
          tenantName: `${payment.lease.tenant.firstName} ${payment.lease.tenant.lastName}`,
          amountDue: payment.amountDue,
          lateFee,
          dueDate: payment.dueDate,
        },
      );
    }
  }
}
```

Schedule the queue in a cron job (daily at midnight):

```typescript
@Injectable()
export class SchedulerService {
  constructor(
    @InjectQueue('overdue-check') private overdueQueue: Queue,
    @InjectQueue('rent-reminders') private reminderQueue: Queue,
    @InjectQueue('lease-expiry') private expiryQueue: Queue,
  ) {}

  @Cron('0 0 * * *')   // Midnight every day
  async runOverdueCheck() {
    await this.overdueQueue.add({});
  }

  @Cron('0 8 * * *')   // 8 AM every day
  async runRentReminders() {
    await this.reminderQueue.add({});
  }

  @Cron('0 9 * * 1')   // 9 AM every Monday
  async runLeaseExpiryCheck() {
    await this.expiryQueue.add({});
  }
}
```

---

## 7. Backend — Reports Endpoints

All reports are `GET` requests returning aggregated data:

```typescript
// GET /reports/occupancy
// Returns occupancy rate per property and globally
async getOccupancyReport() {
  return this.unitRepo
    .createQueryBuilder('u')
    .select('u.property_id', 'propertyId')
    .addSelect('p.name', 'propertyName')
    .addSelect('COUNT(*)', 'totalUnits')
    .addSelect("SUM(CASE WHEN u.status = 'occupied' THEN 1 ELSE 0 END)", 'occupiedUnits')
    .addSelect(
      "ROUND(SUM(CASE WHEN u.status = 'occupied' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1)",
      'occupancyRate',
    )
    .innerJoin('u.property', 'p')
    .groupBy('u.property_id, p.name')
    .getRawMany();
}

// GET /reports/revenue?from=2024-01-01&to=2024-12-31
async getRevenueReport(from: Date, to: Date) {
  return this.paymentRepo
    .createQueryBuilder('p')
    .select("DATE_TRUNC('month', p.payment_date)", 'month')
    .addSelect('SUM(p.amount_paid)', 'revenue')
    .addSelect('SUM(p.late_fee)', 'lateFees')
    .addSelect('COUNT(*)', 'transactionCount')
    .where('p.status = :status', { status: PaymentStatus.PAID })
    .andWhere('p.payment_date BETWEEN :from AND :to', { from, to })
    .groupBy("DATE_TRUNC('month', p.payment_date)")
    .orderBy("DATE_TRUNC('month', p.payment_date)", 'ASC')
    .getRawMany();
}

// GET /reports/maintenance
async getMaintenanceReport() {
  return this.maintenanceRepo
    .createQueryBuilder('m')
    .select('m.category', 'category')
    .addSelect('COUNT(*)', 'total')
    .addSelect('SUM(m.actual_cost)', 'totalCost')
    .addSelect(
      "AVG(EXTRACT(EPOCH FROM (m.completed_at - m.submitted_at)) / 3600)",
      'avgHoursToResolve',
    )
    .groupBy('m.category')
    .getRawMany();
}
```

---

## 8. Backend — `app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { UnitsModule } from './units/units.module';
import { TenantsModule } from './tenants/tenants.module';
import { LeasesModule } from './leases/leases.module';
import { PaymentsModule } from './payments/payments.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { VendorsModule } from './vendors/vendors.module';
import { DocumentsModule } from './documents/documents.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(databaseConfig),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    PropertiesModule,
    UnitsModule,
    TenantsModule,
    LeasesModule,
    PaymentsModule,
    MaintenanceModule,
    VendorsModule,
    DocumentsModule,
    ReportsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
```

### `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for the frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger API docs (available at /api/docs)
  const docConfig = new DocumentBuilder()
    .setTitle('Property Management API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, docConfig));

  // Stripe webhook needs raw body — register before body parsers
  app.use('/payments/webhook', express.raw({ type: 'application/json' }));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();
```

---

## 9. Database — Migrations

### How to create and run migrations

```powershell
# Generate a migration from entity changes
pnpm --filter api migration:generate --name=InitialSchema

# Run all pending migrations
pnpm --filter api migration:run

# Revert the last migration
pnpm --filter api migration:revert
```

### Migration order (create in this order)

1. `CreateUsersTable`
2. `CreateVendorsTable`
3. `CreatePropertiesTable`
4. `CreateUnitsTable`
5. `CreateTenantsTable`
6. `CreateLeasesTable`
7. `CreatePaymentsTable`
8. `CreateMaintenanceRequestsTable`
9. `CreateDocumentsTable`
10. `AddIndexes` — add all composite indexes in one migration

Each migration must include a `down()` method to revert.

### Seed Script (`src/database/seeds/seed.ts`)

The seed must create data in this order (respect FK constraints):

1. 1 owner user + 1 manager user + 2 tenant users + 1 vendor user
2. 3 vendor company profiles
3. 2 properties (1 residential, 1 commercial) owned by owner user
4. 8 units across the 2 properties (mix of types and statuses)
5. 4 tenant profiles linked to 2 of the tenant users
6. 4 leases (3 active, 1 expired) with full payment schedules
7. Set some payments to PAID, some to OVERDUE
8. 3 maintenance requests at different statuses

---

## 10. Frontend — React App

### 10.1 Initialize

```powershell
New-Item -ItemType Directory -Path apps\web -Force
cd apps\web
pnpm create vite . --template react-ts
pnpm install
cd ..\..
```

### 10.2 `apps/web/package.json` — Complete Dependencies

```json
{
  "name": "web",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "@tanstack/react-query": "^5.45.1",
    "@tanstack/react-query-devtools": "^5.45.1",
    "axios": "^1.7.2",
    "react-hook-form": "^7.52.0",
    "zod": "^3.23.8",
    "@hookform/resolvers": "^3.6.0",
    "recharts": "^2.12.7",
    "lucide-react": "^0.400.0",
    "date-fns": "^3.6.0",
    "react-hot-toast": "^2.4.1",
    "react-dropzone": "^14.2.3",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0",
    "class-variance-authority": "^0.7.0",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-tooltip": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-badge": "^1.0.0",
    "@stripe/stripe-js": "^3.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.6",
    "typescript": "^5.4.5",
    "vite": "^5.3.2",
    "vitest": "^1.6.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2"
  }
}
```

### 10.3 Tailwind Config (`tailwind.config.ts`)

```typescript
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          500: '#3b5bdb',
          600: '#2f4ac2',
          700: '#2440a8',
          900: '#1a2e75',
        },
        accent: {
          400: '#20c997',
          500: '#12b886',
        },
        danger: {
          400: '#ff6b6b',
          500: '#fa5252',
        },
        warning: {
          400: '#ffd43b',
          500: '#fab005',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

Add to `index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 10.4 Axios Instance (`src/api/axios.ts`)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: false,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
            refreshToken: refresh,
          });
          localStorage.setItem('access_token', data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
```

### 10.5 AuthContext (`src/auth/AuthContext.tsx`)

```typescript
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import api from '../api/axios';

interface AuthUser {
  id: string;
  email: string;
  role: 'owner' | 'manager' | 'tenant' | 'vendor' | 'admin';
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    api.post('/auth/logout').catch(() => {});
    localStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 10.6 Protected Route (`src/auth/ProtectedRoute.tsx`)

```typescript
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface Props {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user!.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
```

### 10.7 App Router (`src/App.tsx`)

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { PropertiesPage } from './pages/properties/PropertiesPage';
// ... import all pages

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Owner / Manager routes */}
            <Route element={<ProtectedRoute allowedRoles={['owner', 'manager', 'admin']} />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/properties/*" element={<PropertiesPage />} />
                <Route path="/units/*" element={<UnitsPage />} />
                <Route path="/tenants/*" element={<TenantsPage />} />
                <Route path="/leases/*" element={<LeasesPage />} />
                <Route path="/payments/*" element={<PaymentsPage />} />
                <Route path="/maintenance/*" element={<MaintenancePage />} />
                <Route path="/vendors/*" element={<VendorsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>
            </Route>

            {/* Tenant portal */}
            <Route element={<ProtectedRoute allowedRoles={['tenant']} />}>
              <Route element={<AppShell />}>
                <Route path="/portal" element={<TenantPortalPage />} />
              </Route>
            </Route>

            {/* Vendor portal */}
            <Route element={<ProtectedRoute allowedRoles={['vendor']} />}>
              <Route element={<AppShell />}>
                <Route path="/workorders" element={<VendorPortalPage />} />
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### 10.8 Sidebar Navigation (`src/components/layout/Sidebar.tsx`)

The sidebar must render different nav items based on the current user's role:

```typescript
const navByRole = {
  owner: [
    { label: 'Dashboard',    icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Properties',   icon: Building2,       to: '/properties' },
    { label: 'Units',        icon: DoorOpen,         to: '/units' },
    { label: 'Tenants',      icon: Users,            to: '/tenants' },
    { label: 'Leases',       icon: FileText,         to: '/leases' },
    { label: 'Payments',     icon: CreditCard,       to: '/payments' },
    { label: 'Maintenance',  icon: Wrench,           to: '/maintenance' },
    { label: 'Vendors',      icon: HardHat,          to: '/vendors' },
    { label: 'Reports',      icon: BarChart3,        to: '/reports' },
  ],
  manager: [ /* same as owner minus settings */ ],
  tenant:  [{ label: 'My Portal',   icon: Home,    to: '/portal' }],
  vendor:  [{ label: 'Work Orders', icon: ClipboardList, to: '/workorders' }],
};
```

### 10.9 Shared StatusBadge Component

```typescript
const statusConfig = {
  // Unit statuses
  vacant:      { label: 'Vacant',      className: 'bg-red-100 text-red-700' },
  occupied:    { label: 'Occupied',    className: 'bg-green-100 text-green-700' },
  maintenance: { label: 'Maintenance', className: 'bg-amber-100 text-amber-700' },
  // Lease statuses
  active:      { label: 'Active',      className: 'bg-green-100 text-green-700' },
  expired:     { label: 'Expired',     className: 'bg-gray-100 text-gray-600' },
  terminated:  { label: 'Terminated',  className: 'bg-red-100 text-red-700' },
  pending:     { label: 'Pending',     className: 'bg-amber-100 text-amber-700' },
  // Payment statuses
  paid:        { label: 'Paid',        className: 'bg-green-100 text-green-700' },
  overdue:     { label: 'Overdue',     className: 'bg-red-100 text-red-700' },
  partial:     { label: 'Partial',     className: 'bg-blue-100 text-blue-700' },
  // Maintenance statuses
  submitted:   { label: 'Submitted',   className: 'bg-gray-100 text-gray-600' },
  assigned:    { label: 'Assigned',    className: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', className: 'bg-amber-100 text-amber-700' },
  completed:   { label: 'Completed',   className: 'bg-green-100 text-green-700' },
};
```

### 10.10 TanStack Query Hooks Pattern

All data fetching uses this consistent pattern. Example for properties:

```typescript
// src/hooks/useProperties.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';

export const PROPERTIES_KEY = ['properties'] as const;

export function useProperties(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...PROPERTIES_KEY, params],
    queryFn: () => api.get('/properties', { params }).then(r => r.data),
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: [...PROPERTIES_KEY, id],
    queryFn: () => api.get(`/properties/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePropertyDto) => api.post('/properties', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTIES_KEY });
      toast.success('Property created successfully');
    },
    onError: () => toast.error('Failed to create property'),
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdatePropertyDto & { id: string }) =>
      api.patch(`/properties/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTIES_KEY });
      toast.success('Property updated');
    },
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/properties/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTIES_KEY });
      toast.success('Property deleted');
    },
  });
}
```

Repeat this exact pattern for: `useUnits`, `useTenants`, `useLeases`, `usePayments`, `useMaintenance`, `useVendors`.

---

## 11. Shared TypeScript Types (`src/types/index.ts`)

Define all entity interfaces as TypeScript interfaces. These mirror the backend entities exactly:

```typescript
export interface User {
  id: string;
  email: string;
  role: 'owner' | 'manager' | 'tenant' | 'vendor' | 'admin';
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
}

export interface Property {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  type: 'residential' | 'commercial' | 'mixed';
  description?: string;
  acquisitionDate?: string;
  units?: Unit[];
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  property?: Property;
  unitNumber: string;
  type: 'residential' | 'commercial' | 'office' | 'warehouse' | 'retail' | 'mixed';
  floor?: number;
  area?: number;
  rentAmount: number;
  status: 'vacant' | 'occupied' | 'maintenance';
  description?: string;
  leases?: Lease[];
}

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  idNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  leases?: Lease[];
  createdAt: string;
}

export interface Lease {
  id: string;
  unitId: string;
  unit?: Unit;
  tenantId: string;
  tenant?: Tenant;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  paymentSchedule: 'monthly' | 'quarterly' | 'yearly';
  paymentDay: number;
  status: 'pending' | 'active' | 'expired' | 'terminated';
  terminationReason?: string;
  notes?: string;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  leaseId: string;
  lease?: Lease;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  paymentDate?: string;
  method?: 'online' | 'cash' | 'bank_transfer' | 'mobile_money' | 'check';
  lateFee: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  receiptNumber?: string;
  notes?: string;
}

export interface MaintenanceRequest {
  id: string;
  unitId: string;
  unit?: Unit;
  tenantId?: string;
  tenant?: Tenant;
  vendorId?: string;
  vendor?: Vendor;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'structural' | 'cleaning' | 'security' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'submitted' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  estimatedCost?: number;
  actualCost?: number;
  resolutionNotes?: string;
  completedAt?: string;
  attachments: string[];
  submittedAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  servicesOffered: string[];
  hourlyRate?: number;
  notes?: string;
  isActive: boolean;
}

// API pagination wrapper
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

---

## 12. Testing

### 12.1 Backend Unit Tests

Example for the lease service business logic:

```typescript
// src/leases/leases.service.spec.ts
describe('LeasesService', () => {
  describe('generatePaymentSchedule', () => {
    it('should generate 12 monthly payments for a 1-year lease', () => {
      const lease = {
        id: 'test-id',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        rentAmount: 1000,
        paymentDay: 1,
        paymentSchedule: PaymentSchedule.MONTHLY,
      } as Lease;

      const payments = service['generatePaymentSchedule'](lease);
      expect(payments).toHaveLength(12);
      expect(payments[0].dueDate).toEqual(new Date('2024-01-01'));
      expect(payments[11].dueDate).toEqual(new Date('2024-12-01'));
    });
  });

  describe('createLeaseWithPayments', () => {
    it('should throw ConflictException if unit is not vacant', async () => {
      unitRepo.findOneByOrFail.mockResolvedValue({ status: UnitStatus.OCCUPIED });
      await expect(service.createLeaseWithPayments(dto)).rejects.toThrow(ConflictException);
    });
  });
});
```

### 12.2 API Integration Tests

```typescript
// test/properties.e2e-spec.ts
describe('Properties (e2e)', () => {
  let app: INestApplication;
  let ownerToken: string;

  beforeAll(async () => {
    // Setup test app with test DB
    const { accessToken } = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@test.com', password: 'password123' });
    ownerToken = accessToken;
  });

  it('GET /properties — returns list for owner', () => {
    return request(app.getHttpServer())
      .get('/properties')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });

  it('POST /properties — creates property', () => {
    return request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Test Building', address: '123 Main St', type: 'residential' })
      .expect(201)
      .expect(res => {
        expect(res.body.name).toBe('Test Building');
      });
  });
});
```

### 12.3 Frontend Component Tests

```typescript
// src/pages/properties/PropertiesPage.test.tsx
it('renders property list with correct count', async () => {
  render(
    <QueryClientProvider client={testQueryClient}>
      <PropertiesPage />
    </QueryClientProvider>
  );
  await waitFor(() => {
    expect(screen.getByText('Sunrise Apartments')).toBeInTheDocument();
  });
});
```

---

## 13. Production Deployment (Windows Server)

> **Target**: Windows Server 2019/2022 or a Windows 10/11 machine acting as the app server.  
> All commands are **PowerShell (Administrator)** unless stated otherwise.

### 13.1 Server Setup

```powershell
# 1. Install Node.js 20 LTS on the server
#    Download from https://nodejs.org and run the .msi installer

# 2. Install pnpm and PM2 globally
npm install -g pnpm pm2

# 3. Install pm2-windows-startup so PM2 restarts after server reboot
npm install -g pm2-windows-startup
pm2-startup install

# 4. Install PostgreSQL 16 (via installer, same as dev — set password to 'admin')
#    https://www.postgresql.org/download/windows/

# 5. Install Memurai (Redis for Windows)
#    https://www.memurai.com/get-memurai
#    Memurai installs as a Windows Service automatically

# 6. Clone the repo
git clone https://github.com/your-org/property-management.git C:\property-management
cd C:\property-management

# 7. Create .env from example and populate production values
Copy-Item apps\api\.env.example apps\api\.env
# Open in Notepad and fill in all values:
notepad apps\api\.env

# 8. Install dependencies, run migrations, build everything
pnpm install --frozen-lockfile
pnpm migration:run
pnpm seed        # Only on first deploy
pnpm build

# 9. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save         # Persist PM2 process list across reboots
```

### 13.2 PM2 Ecosystem (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [
    {
      name: 'property-api',
      script: './apps/api/dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/api-error.log',
      out_file:   './logs/api-out.log',
      time: true,
    },
  ],
};
```

```powershell
# Create the logs directory so PM2 doesn't fail on first start
New-Item -ItemType Directory -Path C:\property-management\logs -Force
```

### 13.3 Nginx for Windows

Nginx runs as a Windows service managed by **NSSM** (Non-Sucking Service Manager).

```powershell
# 1. Download Nginx Windows binary and extract to C:\nginx
#    https://nginx.org/en/download.html  (stable version)

# 2. Write the site config
$nginxConf = @"
worker_processes  auto;

events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    keepalive_timeout 65;

    server {
        listen 80;
        server_name yourdomain.com;

        # React SPA
        location / {
            root   C:/property-management/apps/web/dist;
            try_files `$uri `$uri/ /index.html;
            expires 1h;
        }

        # API reverse proxy
        location /api/ {
            rewrite ^/api/(.*) /`$1 break;
            proxy_pass         http://127.0.0.1:3001;
            proxy_http_version 1.1;
            proxy_set_header   Upgrade `$http_upgrade;
            proxy_set_header   Connection 'upgrade';
            proxy_set_header   Host `$host;
            proxy_cache_bypass `$http_upgrade;
        }

        # Stripe webhook — raw body passthrough
        location /api/payments/webhook {
            proxy_pass        http://127.0.0.1:3001/payments/webhook;
            proxy_set_header  Host `$host;
            proxy_read_timeout 30s;
        }

        # Uploaded files — internal only
        location /uploads/ {
            internal;
            alias C:/property-management/apps/api/uploads/;
        }

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Referrer-Policy strict-origin-when-cross-origin;

        client_max_body_size 20M;
    }
}
"@
$nginxConf | Out-File -FilePath C:\nginx\conf\nginx.conf -Encoding utf8

# 3. Test the config
C:\nginx\nginx.exe -t

# 4. Install Nginx as a Windows service using NSSM
#    Download NSSM from https://nssm.cc/download and extract nssm.exe to C:\Windows\System32

nssm install nginx C:\nginx\nginx.exe
nssm set nginx AppDirectory C:\nginx
nssm set nginx Description "Nginx Web Server"
nssm start nginx

# Nginx service commands
nssm start nginx
nssm stop nginx
nssm restart nginx
```

**HTTPS / SSL on Windows**: Use [win-acme](https://www.win-acme.com/) (a free Let's Encrypt client for Windows):

```powershell
# Download win-acme from https://www.win-acme.com/
# Run the interactive client
.\wacs.exe
# Follow prompts: choose Nginx, enter yourdomain.com
# win-acme auto-renews the certificate via Windows Task Scheduler
```

### 13.4 Automated Database Backups (Windows Task Scheduler)

```powershell
# Create backup script at C:\property-management\scripts\pg-backup.ps1

@'
$BACKUP_DIR = "C:\pg-backups"
$DB_NAME    = "property_mgmt"
$TIMESTAMP  = Get-Date -Format "yyyyMMdd_HHmmss"
$env:PGPASSWORD = "admin"

if (-not (Test-Path $BACKUP_DIR)) { New-Item -ItemType Directory -Path $BACKUP_DIR }

# Dump and compress
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U admin $DB_NAME |
  Out-File -FilePath "$BACKUP_DIR\${DB_NAME}_${TIMESTAMP}.sql" -Encoding utf8

Compress-Archive `
  -Path "$BACKUP_DIR\${DB_NAME}_${TIMESTAMP}.sql" `
  -DestinationPath "$BACKUP_DIR\${DB_NAME}_${TIMESTAMP}.zip" `
  -CompressionLevel Optimal

Remove-Item "$BACKUP_DIR\${DB_NAME}_${TIMESTAMP}.sql"

# Delete backups older than 30 days
Get-ChildItem $BACKUP_DIR -Filter "*.zip" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
  Remove-Item

Write-Host "Backup complete: ${DB_NAME}_${TIMESTAMP}.zip"
'@ | Out-File -FilePath C:\property-management\scripts\pg-backup.ps1 -Encoding utf8

# Register as a scheduled task (runs daily at 2 AM)
$action  = New-ScheduledTaskAction -Execute "powershell.exe" `
             -Argument "-NonInteractive -File C:\property-management\scripts\pg-backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$settings = New-ScheduledTaskSettingsSet -RunOnlyIfNetworkAvailable

Register-ScheduledTask `
  -TaskName "PropertyMgmtDBBackup" `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -RunLevel Highest `
  -Force

Write-Host "Backup task registered. Next run: 2 AM daily."
```

---

## 14. CI/CD — GitHub Actions (`.github/workflows/deploy.yml`)

```yaml
name: Test, Build & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: property_mgmt_test
          POSTGRES_USER: admin
          POSTGRES_PASSWORD: admin
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter api migration:run
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: property_mgmt_test
          DB_USER: admin
          DB_PASSWORD: admin
          JWT_SECRET: ci_test_secret_at_least_32_chars_abc
          JWT_REFRESH_SECRET: ci_refresh_secret_at_least_32_chars_xyz
      - run: pnpm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          # The deploy target is a Windows Server with OpenSSH installed.
          # Commands run in PowerShell via SSH.
          script: |
            cd C:\property-management
            git pull origin main
            pnpm install --frozen-lockfile
            pnpm migration:run
            pnpm build
            pm2 reload ecosystem.config.js --env production
            Write-Host "Deploy complete at $(Get-Date)"
```

---

## 15. Build Order for Claude Code

Follow this exact sequence. Each step must compile and start before moving to the next.

### Step 1 — Repository scaffold
- Create all directories listed in §2.2
- Initialize git, pnpm workspace
- Create root `package.json`, `.gitignore`, `.env.example`

### Step 2 — Database & environment
- Run `.\scripts\setup-db.ps1` in PowerShell as Administrator
- Copy `.env.example` to `.env` in both `apps/api` and `apps/web`
- Fill all values in `apps/api/.env` (DB_USER=admin, DB_PASSWORD=admin are already set)

### Step 3 — NestJS bootstrap
- Initialize NestJS project in `apps/api`
- Install all dependencies from §4.2
- Configure TypeORM connection in `database.config.ts`
- Create `app.module.ts` and `main.ts`
- Confirm `pnpm --filter api dev` starts without errors

### Step 4 — Entities & migrations
- Create all 8 entity files (§4.4)
- Generate migration: `pnpm --filter api migration:generate --name=InitialSchema`
- Run migration: `pnpm --filter api migration:run`
- Verify all tables exist in PostgreSQL:
  ```powershell
  $env:PGPASSWORD = "admin"
  psql -U admin -d property_mgmt -c "\dt"
  ```

### Step 5 — Auth module
- Implement `AuthModule`, `AuthService`, `AuthController`
- Implement `JwtStrategy`, `JwtAuthGuard`, `RolesGuard`
- Implement `RolesDecorator`, `CurrentUserDecorator`
- Test: `POST /auth/register` and `POST /auth/login` return JWT tokens

### Step 6 — Resource modules (one at a time)
For each resource in this order: `Users → Properties → Units → Tenants → Leases → Payments → Maintenance → Vendors → Documents`

Each module needs:
- `<name>.entity.ts` (already done in Step 4)
- `<name>.module.ts`
- `<name>.service.ts`
- `<name>.controller.ts`
- `dto/create-<name>.dto.ts`
- `dto/update-<name>.dto.ts`

### Step 7 — Business logic
- Implement `createLeaseWithPayments` with auto-payment generation (§6.1)
- Implement `terminateLease` and `renewLease`
- Implement `recordPayment` and `createStripeCheckout` (§6.2)
- Implement overdue fee cron job (§6.3)
- Test the full lease → payment flow end-to-end

### Step 8 — Reports & Notifications
- Implement all 3 report endpoints (§7)
- Set up Bull queues and processors (§6.3)
- Implement `EmailService` with Nodemailer
- Test email delivery via Mailtrap

### Step 9 — Seed data
- Write and run `src/database/seeds/seed.ts`
- Verify data is correct via Swagger UI at `http://localhost:3001/api/docs`

### Step 10 — React frontend bootstrap
- Initialize Vite React project in `apps/web`
- Install all dependencies from §10.2
- Configure Tailwind + Google Fonts (§10.3)
- Create `axios.ts` instance with interceptors (§10.4)
- Implement `AuthContext` + `ProtectedRoute` (§10.5, §10.6)
- Implement `App.tsx` router (§10.7)
- Confirm `pnpm --filter web dev` opens the login page

### Step 11 — AppShell & Sidebar
- Implement `AppShell.tsx`, `Sidebar.tsx`, `TopBar.tsx`
- Sidebar must show correct nav items based on user role
- All navigation links must route correctly

### Step 12 — Login & Register pages
- `LoginPage.tsx` with React Hook Form + Zod validation
- On success, redirect based on role (owner/manager → `/dashboard`, tenant → `/portal`, vendor → `/workorders`)
- `RegisterPage.tsx` (admin use only or owner self-registration)

### Step 13 — Dashboard page
- Summary KPI cards: total properties, units, occupancy %, monthly revenue, overdue count, open maintenance
- Revenue line chart using Recharts (last 12 months)
- Occupancy pie chart by unit type
- Recent activity feed
- Quick-action buttons

### Step 14 — Properties, Units, Tenants modules
For each: List page (with search + filter + pagination) → Detail page → Form page (Add/Edit)
Implement all TanStack Query hooks from the pattern in §10.10

### Step 15 — Leases module
- List page with "Expiring Soon" warning badges (≤30 days)
- Detail page with payment schedule table
- Lease form with unit selector (only vacant units) + tenant selector
- Terminate and Renew action buttons with confirmation dialog

### Step 16 — Payments module
- Payment list with overdue highlighting in red
- Record payment form (offline) with method selector
- Stripe checkout button (online payment) for tenant portal
- Payment summary statistics card

### Step 17 — Maintenance module
- Submission form with file upload (react-dropzone) for tenants
- Manager view with assign vendor dropdown
- Status update flow (submitted → assigned → in_progress → completed)
- Optional Kanban board view

### Step 18 — Vendors, Documents, Reports modules
- Vendor CRUD with services list
- Document upload/download UI
- Reports page with 3 charts (occupancy, revenue, maintenance costs) and CSV export

### Step 19 — Tenant Portal & Vendor Portal
- Tenant portal: lease info card, payment history, pay rent button, submit maintenance form
- Vendor portal: assigned work orders list, status update capability

### Step 20 — Testing
- Write unit tests for business logic services (§12.1)
- Write API integration tests for all major routes (§12.2)
- Write component tests for critical UI (§12.3)
- Confirm `pnpm test` passes across both apps

### Step 21 — Production deployment
- Set up server prerequisites (§13.1)
- Create `ecosystem.config.js` (§13.2)
- Configure and enable Nginx (§13.3)
- Set up database backup cron (§13.4)
- Set up GitHub Actions secrets and test the deploy pipeline (§14)

---

## 16. Common Pitfalls & Solutions

| Issue | Solution |
|---|---|
| TypeORM `synchronize: true` in prod | Always `false` — use `migration:run` |
| Stripe webhook 400 error | Must use `express.raw()` middleware before JSON body parser for `/payments/webhook` |
| CORS errors in dev | Ensure `FRONTEND_URL=http://localhost:5173` in `.env` matches Vite's port exactly |
| JWT expired mid-session | Axios interceptor (§10.4) silently refreshes the token — never show login page unexpectedly |
| Overlapping leases | Check for active lease on unit before creating new one (§6.1) |
| Bull queue not processing | Ensure Memurai is running: `Get-Service Memurai` → Status must be Running. Then `redis-cli ping` → PONG |
| Migration fails | Ensure `DB_USER=admin` has SUPERUSER or at minimum CREATE TABLE privileges on `property_mgmt` |
| `psql` not found in PowerShell | Add `C:\Program Files\PostgreSQL\16\bin` to system PATH (§1.3) and restart PowerShell |
| File uploads 413 error | Add `client_max_body_size 20M;` inside the `server {}` block in `C:\nginx\conf\nginx.conf` |
| React Query stale data | Call `queryClient.invalidateQueries()` after every mutation |
| PM2 not restarting on Windows reboot | Run `pm2-startup install` and `pm2 save` after first `pm2 start` |
| Nginx not starting as a service | Check `C:\nginx\logs\error.log` — usually a port 80 conflict with IIS or another process. Stop IIS: `iisreset /stop` |
| `pnpm` not found after Node.js install | Run `npm install -g pnpm` then restart PowerShell |

---

## 17. Security Checklist

Before going live, verify every item:

- [ ] All `.env` files are in `.gitignore` and never committed
- [ ] JWT secrets are at least 32 random characters
- [ ] Stripe webhook secret is verified on every incoming request
- [ ] File upload MIME type validation is in place (Multer `fileFilter`)
- [ ] All API routes (except `/auth/*`) require a valid JWT
- [ ] `RolesGuard` is applied on every controller method that needs it
- [ ] Tenants can only access their own lease and payment records
- [ ] Vendors can only view and update work orders assigned to them
- [ ] PostgreSQL user `admin` credentials are not reused elsewhere and DB access is restricted to localhost only
- [ ] Uploaded file paths are never returned raw in API responses
- [ ] HTTPS is enforced via Nginx redirect (§13.3)
- [ ] Security headers are set in Nginx config (X-Frame-Options, CSP, etc.)
- [ ] Database backups are running and verified restorable
- [ ] `NODE_ENV=production` is set in PM2 env

---

*End of Implementation Guide*
