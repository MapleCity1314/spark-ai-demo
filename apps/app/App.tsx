import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import WelcomePage from './pages/welcome-page';
import AssessmentPage from './pages/assessment-page';
import SetupPage from './pages/setup-page';
import BattlePage from './pages/battle-page';
import ReportPage from './pages/report-page';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/assessment" element={<AssessmentPage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/battle" element={<BattlePage />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
