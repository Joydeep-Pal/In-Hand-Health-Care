import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from '../Navbar/Navbar.jsx'
import ChatbotPage from '../Chatbot/ChatbotPage.jsx'
import DiseaseRecognizerPage from '../DiseaseRecognizer/DiseaseRecognizerPage.jsx'
import DiseasesPage from '../Diseases/DiseasesPage.jsx'
import DiseaseDetailPage from '../Diseases/DiseaseDetailPage.jsx'
import MedicineFinderPage from '../MedicineFinder/MedicineFinderPage.jsx'
import InventoryPage from '../Retailer/InventoryPage.jsx'
import AboutPage from '../About/AboutPage.jsx'
import NearbyHealthcare from '../../../../location/client/src/pages/NearbyHealthcare.jsx'

function CustomerRoute({ children }) {
  if (localStorage.getItem('sd_role') === 'retailer') {
    return <Navigate to="/retailer/inventory" replace />
  }
  return children
}

export default function HomePage() {
  return (
    <div className="h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 overflow-y-auto relative">
        <Routes>
          <Route path="/" element={<Navigate to={localStorage.getItem('sd_role') === 'retailer' ? '/retailer/inventory' : '/disease-recognizer'} replace />} />
          <Route path="/chatbot" element={<CustomerRoute><ChatbotPage /></CustomerRoute>} />
          <Route path="/disease-recognizer" element={<CustomerRoute><DiseaseRecognizerPage /></CustomerRoute>} />
          <Route path="/diseases" element={<CustomerRoute><DiseasesPage /></CustomerRoute>} />
          <Route path="/diseases/:id" element={<CustomerRoute><DiseaseDetailPage /></CustomerRoute>} />
          <Route path="/medicine-finder" element={<MedicineFinderPage />} />
          <Route path="/nearby" element={<NearbyHealthcare />} />
          <Route path="/retailer/inventory" element={localStorage.getItem('sd_role') === 'retailer' ? <InventoryPage /> : <Navigate to="/disease-recognizer" replace />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>

    </div>
  )
}
