import { Navigate, Route, Routes } from 'react-router-dom';
import { BuilderPage } from './pages/BuilderPage';
import { NewCityPage } from './pages/NewCityPage';
import { ShareCityPage } from './pages/ShareCityPage';
import { VisitorTestPage } from './pages/VisitorTestPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/build" replace />} />
      <Route path="/new" element={<NewCityPage />} />
      <Route path="/build" element={<BuilderPage />} />
      <Route path="/share/:cityId" element={<ShareCityPage />} />
      <Route path="/visit/:cityId" element={<VisitorTestPage />} />
    </Routes>
  );
}
