// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Gallery from "./pages/Gallery";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
        <Toaster richColors position="top-center" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Routes>
          <Route 
            path="/" 
            element={user ? <Navigate to="/gallery" replace /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/gallery" replace /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/gallery" replace /> : <Register />} 
          />
          <Route 
            path="/gallery" 
            element={
              <ProtectedRoute>
                <Gallery />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <Toaster richColors position="top-center" />
      </div>
    </Router>
  );
}

export default App;
