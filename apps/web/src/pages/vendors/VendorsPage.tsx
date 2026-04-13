import { Routes, Route } from 'react-router-dom';
import { VendorsList } from './VendorsList';
import { VendorForm } from './VendorForm';

export function VendorsPage() {
  return (
    <Routes>
      <Route index element={<VendorsList />} />
      <Route path="new" element={<VendorForm />} />
      <Route path=":id/edit" element={<VendorForm />} />
    </Routes>
  );
}
