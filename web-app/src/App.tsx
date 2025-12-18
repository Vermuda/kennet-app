import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import FloorBlueprintPage from './pages/FloorBlueprintPage';
import BlueprintViewPage from './pages/BlueprintViewPage';
import InspectionInputPage from './pages/InspectionInputPage';
import CameraPage from './pages/CameraPage';
import DefectInputPage from './pages/DefectInputPage';
import DefectListPage from './pages/DefectListPage';
import DefectEditPage from './pages/DefectEditPage';
import ReferenceImageInputPage from './pages/ReferenceImageInputPage';
import ReferenceImagesPage from './pages/ReferenceImagesPage';
import StorageDebugInfo from './components/StorageDebugInfo';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
        <Route path="/floors/:floorId" element={<FloorBlueprintPage />} />
        <Route path="/blueprints/:blueprintId" element={<BlueprintViewPage />} />
        <Route path="/inspection/new" element={<InspectionInputPage />} />
        <Route path="/camera/:mode" element={<CameraPage />} />
        <Route path="/defect/input" element={<DefectInputPage />} />
        <Route path="/defects/:blueprintId" element={<DefectListPage />} />
        <Route path="/defect/edit/:defectId" element={<DefectEditPage />} />
        <Route path="/reference-images/input" element={<ReferenceImageInputPage />} />
        <Route path="/reference-images/:blueprintId" element={<ReferenceImagesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* デバッグ情報表示（開発中のみ表示） */}
      <StorageDebugInfo show={import.meta.env.DEV} />
    </Router>
  );
};

export default App;
