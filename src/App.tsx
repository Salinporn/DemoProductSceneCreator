import { Routes, Route, Navigate } from 'react-router-dom';
import { DemoProductSceneCreator } from './pages/DemoProductSceneCreator';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<DemoProductSceneCreator />} />
      <Route path="/" element={<DemoProductSceneCreator />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;