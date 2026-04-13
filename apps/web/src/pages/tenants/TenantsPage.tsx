import { Routes, Route } from 'react-router-dom';
import { TenantsList } from './TenantsList';
import { TenantDetail } from './TenantDetail';
import { TenantForm } from './TenantForm';

export function TenantsPage() {
  return (
    <Routes>
      <Route index element={<TenantsList />} />
      <Route path="new" element={<TenantForm />} />
      <Route path=":id" element={<TenantDetail />} />
      <Route path=":id/edit" element={<TenantForm />} />
    </Routes>
  );
}
