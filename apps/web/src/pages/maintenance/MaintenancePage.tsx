import { Routes, Route } from 'react-router-dom';
import { MaintenanceList } from './MaintenanceList';
import { MaintenanceDetail } from './MaintenanceDetail';
import { MaintenanceForm } from './MaintenanceForm';

export function MaintenancePage() {
  return (
    <Routes>
      <Route index element={<MaintenanceList />} />
      <Route path="new" element={<MaintenanceForm />} />
      <Route path=":id" element={<MaintenanceDetail />} />
      <Route path=":id/edit" element={<MaintenanceForm />} />
    </Routes>
  );
}
