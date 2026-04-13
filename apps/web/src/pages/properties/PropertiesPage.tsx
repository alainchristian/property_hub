import { Routes, Route } from 'react-router-dom';
import { PropertiesList } from './PropertiesList';
import { PropertyDetail } from './PropertyDetail';
import { PropertyForm } from './PropertyForm';

export function PropertiesPage() {
  return (
    <Routes>
      <Route index element={<PropertiesList />} />
      <Route path="new" element={<PropertyForm />} />
      <Route path=":id" element={<PropertyDetail />} />
      <Route path=":id/edit" element={<PropertyForm />} />
    </Routes>
  );
}
