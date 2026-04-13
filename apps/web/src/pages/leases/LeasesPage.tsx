import { Routes, Route } from 'react-router-dom';
import { LeasesList } from './LeasesList';
import { LeaseDetail } from './LeaseDetail';
import { LeaseForm } from './LeaseForm';

export function LeasesPage() {
  return (
    <Routes>
      <Route index element={<LeasesList />} />
      <Route path="new" element={<LeaseForm />} />
      <Route path=":id" element={<LeaseDetail />} />
      <Route path=":id/edit" element={<LeaseForm />} />
    </Routes>
  );
}
