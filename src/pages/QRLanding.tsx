import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QrCode, ArrowRight } from 'lucide-react';
import { logQRScan } from '../utils/qrUtils';

const QRLanding: React.FC = () => {
  const { codificacion } = useParams<{ codificacion: string }>();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const logScanAndRedirect = async () => {
      if (!codificacion) {
        navigate('/', { replace: true });
        return;
      }

      try {
        // Registrar el escaneo del QR
        await logQRScan(codificacion);
      } catch (error) {
        console.error('Error logging QR scan:', error);
        // Continuar con la redirección aunque falle el logging
      }

      // Iniciar countdown
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setIsRedirecting(true);
            // Redirigir a la página del producto
            navigate(`/product/${codificacion}`, { replace: true });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    };

    logScanAndRedirect();
  }, [codificacion, navigate]);

  const handleSkipWait = () => {
    setIsRedirecting(true);
    navigate(`/product/${codificacion}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* QR Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <QrCode className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Código QR Escaneado
          </h1>
          
          <p className="text-gray-600 mb-6">
            Cargando información del producto...
          </p>

          {/* Loading Animation */}
          <div className="mb-6">
            <div className="flex justify-center items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>

          {/* Countdown */}
          {!isRedirecting && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-3">
                Redirigiendo en {countdown} segundo{countdown !== 1 ? 's' : ''}...
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Skip Button */}
          <button
            onClick={handleSkipWait}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver información ahora
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>

          {/* Product Code */}
          {codificacion && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Producto: <span className="font-mono">{codificacion}</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-6">
          Sistema de Gestión de Certificados y DJC
        </p>
      </div>
    </div>
  );
};

export default QRLanding;