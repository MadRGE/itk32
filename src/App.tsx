import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import AuthForm from './components/Auth/AuthForm';
import Header from './components/Layout/Header';
import ProductsSection from './components/Products/ProductsSection';
import ClientsSection from './components/Clients/ClientsSection';
import ValidationSection from './components/Validation/ValidationSection';
import ConfigurationSection from './components/Configuration/ConfigurationSection';
import ProductPassport from './pages/ProductPassport';
import QRLanding from './pages/QRLanding';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentSection, setCurrentSection] = useState('products');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          {/* Rutas públicas para QR */}
          <Route path="/qr/:codificacion" element={<QRLanding />} />
          <Route path="/product/:codificacion" element={<ProductPassport />} />
          {/* Ruta de autenticación por defecto */}
          <Route path="*" element={<AuthForm />} />
        </Routes>
      </Router>
    );
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'products':
        return <ProductsSection />;
      case 'clients':
        return <ClientsSection />;
      case 'validation':
        return <ValidationSection />;
      case 'config':
        return <ConfigurationSection />;
      default:
        return <ProductsSection />;
    }
  };

  return (
    <Router>
      <Routes>
        {/* Rutas públicas para QR */}
        <Route path="/qr/:codificacion" element={<QRLanding />} />
        <Route path="/product/:codificacion" element={<ProductPassport />} />
        
        {/* Rutas privadas (requieren autenticación) */}
        <Route path="/*" element={
          <div className="min-h-screen bg-gray-100">
            <Header currentSection={currentSection} onSectionChange={setCurrentSection} />
            
            <main className="py-6 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                {renderCurrentSection()}
              </div>
            </main>
          </div>
        } />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;