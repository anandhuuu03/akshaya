import { useState } from 'react';
import './App.css';
import { Route, Routes } from 'react-router-dom';

import Homepage from './homepage/home';
import EditHistory from './history/editpage';
import DailyReport from './reports/reportpage';
import MonthlySummary from './monthly/newsummary';
import WeeklyReport from './monthly/summaryy';

import TopNavbar from './Components/TopNavbar';

function App() {
  return (
    <div>
      <TopNavbar />
      <div className="p-4">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="history" element={<EditHistory />} />
          <Route path="report" element={<DailyReport />} />
          <Route path="summary" element={<MonthlySummary />} />
          <Route path="weekly" element={<WeeklyReport />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
