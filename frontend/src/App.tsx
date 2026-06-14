import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ImportPage } from './pages/ImportPage';
import { GroupsListPage } from './pages/GroupsListPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/groups" element={<GroupsListPage />} />
        <Route path="/groups/:id" element={<DashboardPage />} />
        <Route path="/groups/:id/import" element={<ImportPage />} />
        <Route path="*" element={<Navigate to="/groups" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
