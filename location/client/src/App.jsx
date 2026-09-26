import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NearbyHealthcare from './pages/NearbyHealthcare';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/nearby" replace />} />
        <Route path="/nearby" element={<NearbyHealthcare />} />
      </Routes>
    </BrowserRouter>
  );
}
