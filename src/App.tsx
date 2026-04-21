/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Eligibility from './pages/Eligibility';
import Kyc from './pages/Kyc';
import Payment from './pages/Payment';
import Success from './pages/Success';
import Admin from './pages/Admin';
import AdminLock from '../AdminLock';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#1A1A1A]">
          <Routes>
            <Route path="/" element={<Eligibility />} />
            <Route path="/kyc" element={<Kyc />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/success" element={<Success />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <AdminLock />
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}
