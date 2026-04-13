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

export interface Document {
  id: string;
  refType: 'property' | 'unit' | 'lease' | 'payment' | 'maintenance' | 'tenant';
  refId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  version: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
