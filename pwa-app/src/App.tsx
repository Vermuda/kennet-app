import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import DateWeatherInputPage from './pages/DateWeatherInputPage';
import StandardPhotosPage from './pages/StandardPhotosPage';
import FloorBlueprintPage from './pages/FloorBlueprintPage';
import OrientationSettingPage from './pages/OrientationSettingPage';
import BlueprintViewPage from './pages/BlueprintViewPage';
import InspectionChecklistPage from './pages/InspectionChecklistPage';
import SelectPositionPage from './pages/SelectPositionPage';
import CameraPage from './pages/CameraPage';
import DefectInputPage from './pages/DefectInputPage';
import DefectListPage from './pages/DefectListPage';
import DefectEditPage from './pages/DefectEditPage';
import ReferenceImageInputPage from './pages/ReferenceImageInputPage';
import ReferenceImagesPage from './pages/ReferenceImagesPage';
import SettingsPage from './pages/SettingsPage';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
        <Route path="/properties/:propertyId/date-weather" element={<DateWeatherInputPage />} />
        <Route path="/properties/:propertyId/standard-photos" element={<StandardPhotosPage />} />
        <Route path="/floors/:floorId" element={<FloorBlueprintPage />} />
        <Route path="/blueprints/:blueprintId" element={<BlueprintViewPage />} />
        <Route path="/blueprints/:blueprintId/orientation" element={<OrientationSettingPage />} />
        <Route path="/properties/:propertyId/inspection-checklist" element={<InspectionChecklistPage />} />
        <Route path="/properties/:propertyId/select-position" element={<SelectPositionPage />} />
        <Route path="/camera/:mode" element={<CameraPage />} />
        <Route path="/defect/input" element={<DefectInputPage />} />
        <Route path="/defects/:blueprintId" element={<DefectListPage />} />
        <Route path="/defect/edit/:defectId" element={<DefectEditPage />} />
        <Route path="/reference-images/input" element={<ReferenceImageInputPage />} />
        <Route path="/reference-images/:blueprintId" element={<ReferenceImagesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* PWAインストールプロンプト */}
      <PWAInstallPrompt />
      
      {/* PWA更新通知 */}
      <PWAUpdatePrompt />
    </Router>
  );
};

export default App;
