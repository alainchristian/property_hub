import { Routes, Route } from 'react-router-dom';
import { UnitsList } from './UnitsList';
import { UnitDetail } from './UnitDetail';
import { UnitForm } from './UnitForm';

export function UnitsPage() {
  return (
    <Routes>
      <Route index element={<UnitsList />} />
      <Route path="new" element={<UnitForm />} />
      <Route path=":id" element={<UnitDetail />} />
      <Route path=":id/edit" element={<UnitForm />} />
    </Routes>
  );
}
