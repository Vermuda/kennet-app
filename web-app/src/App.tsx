import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import StorageDebugInfo from './components/StorageDebugInfo';

// StorageDebugInfoの表示制御用コンポーネント
const ConditionalStorageDebugInfo: React.FC = () => {
  const location = useLocation();
  // 方位設定画面では非表示
  const isOrientationPage = location.pathname.includes('/orientation');
  
  if (isOrientationPage) return null;
  
  return <StorageDebugInfo show={import.meta.env.DEV} />;
};

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* デバッグ情報表示（開発中のみ、方位設定画面以外で表示） */}
      <ConditionalStorageDebugInfo />
    </Router>
  );
};

export default App;
