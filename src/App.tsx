import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Login } from './pages/auth/Login';
import { ProductDemo } from './pages/ProductDemo';
import { NotAuthorized } from './pages/auth/NotAuthorized';
import { ProtectedRoute } from './pages/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<NotAuthorized />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProductDemo />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;