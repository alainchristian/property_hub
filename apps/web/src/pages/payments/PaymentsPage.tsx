import { Routes, Route } from 'react-router-dom';
import { PaymentsList } from './PaymentsList';
import { PaymentDetail } from './PaymentDetail';

export function PaymentsPage() {
  return (
    <Routes>
      <Route index element={<PaymentsList />} />
      <Route path=":id" element={<PaymentDetail />} />
    </Routes>
  );
}
