import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Package, Calendar, Building, CheckCircle, AlertTriangle, ExternalLink, QrCode } from 'lucide-react';
import { logQRScan } from '../utils/qrUtils';

interface Product {
  codificacion: string;
  cuit: number | null;
  titular: string | null;
  tipo_certificacion: string | null;
  estado: string | null;
  producto: string | null;
  marca: string | null;
  modelo: string | null;
  caracteristicas_tecnicas: string | null;
  normas_aplicacion: string | null;
  fecha_emision: string | null;
  vencimiento: string | null;
  dias_para_vencer: number | null;
  djc_status: 'No Generada' | 'Generada Pendiente de Firma' | 'Firmada';
  certificado_status: 'Pendiente Subida' | 'Subido';
  fabricante: string | null;
  origen: string | null;
  laboratorio: string | null;
}

interface Client {
  cuit: number;
  razon_social: string | null;
  nombre_comercial: string | null;
  correo_electronico: string | null;
  telefono: string | null;
  domicilio_legal: string | null;
}

const ProductPassport: React.FC = () => {
  const { codificacion } = useParams<{ codificacion: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!codificacion) {
        setError('Código de producto no válido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Registrar el escaneo del QR
        await logQRScan(codificacion);

        if (!supabase) {
          throw new Error('Servicio no disponible');
        }

        // Obtener datos del producto
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('codificacion', codificacion)
          .single();

        if (productError) {
          throw new Error('Producto no encontrado');
        }

        if (!productData) {
          throw new Error('Producto no encontrado');
        }

        setProduct(productData);

        // Obtener datos del cliente asociado
        if (productData.cuit) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('cuit', productData.cuit)
            .single();

          if (clientData) {
            setClient(clientData);
          }
        }

        // Actualizar el título de la página
        document.title = `${productData.producto || productData.codificacion} - Información del Producto`;

      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar la información del producto');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [codificacion]);

  const getStatusColor = (estado: string | null, diasParaVencer: number | null) => {
    if (!estado) return 'bg-gray-100 text-gray-800';
    
    if (estado === 'VIGENTE') {
      if (diasParaVencer !== null && diasParaVencer <= 30) {
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      }
      return 'bg-green-100 text-green-800 border-green-200';
    }
    
    if (estado === 'VENCIDO') return 'bg-red-100 text-red-800 border-red-200';
    if (estado === 'CANCELADO') return 'bg-gray-100 text-gray-800 border-gray-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getDjcStatusColor = (status: string) => {
    switch (status) {
      case 'Firmada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Generada Pendiente de Firma':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información del producto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Verifique que el código QR sea válido o contacte al proveedor.
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Producto no encontrado</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <QrCode className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Información del Producto</h1>
              <p className="text-gray-600">Certificado y detalles técnicos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Product Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {product.producto || 'Producto'}
                </h2>
                <p className="text-gray-600">Código: {product.codificacion}</p>
              </div>
              <div className="mt-4 md:mt-0">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(product.estado, product.dias_para_vencer)}`}>
                  {product.estado === 'VIGENTE' && <CheckCircle className="h-4 w-4 mr-1" />}
                  {product.estado === 'VENCIDO' && <AlertTriangle className="h-4 w-4 mr-1" />}
                  {product.estado || 'Estado no definido'}
                </span>
              </div>
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Información del Producto</h3>
                <div className="space-y-2 text-sm">
                  {product.marca && (
                    <div><span className="font-medium text-gray-700">Marca:</span> {product.marca}</div>
                  )}
                  {product.modelo && (
                    <div><span className="font-medium text-gray-700">Modelo:</span> {product.modelo}</div>
                  )}
                  {product.fabricante && (
                    <div><span className="font-medium text-gray-700">Fabricante:</span> {product.fabricante}</div>
                  )}
                  {product.origen && (
                    <div><span className="font-medium text-gray-700">Origen:</span> {product.origen}</div>
                  )}
                  {product.tipo_certificacion && (
                    <div><span className="font-medium text-gray-700">Tipo de Certificación:</span> {product.tipo_certificacion}</div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Fechas y Validez</h3>
                <div className="space-y-2 text-sm">
                  {product.fecha_emision && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-700">Emisión:</span>
                      <span className="ml-1">{new Date(product.fecha_emision).toLocaleDateString()}</span>
                    </div>
                  )}
                  {product.vencimiento && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-700">Vencimiento:</span>
                      <span className="ml-1">{new Date(product.vencimiento).toLocaleDateString()}</span>
                    </div>
                  )}
                  {product.dias_para_vencer !== null && (
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700">Días para vencer:</span>
                      <span className={`ml-1 ${product.dias_para_vencer <= 30 ? 'text-yellow-600 font-medium' : 'text-green-600'}`}>
                        {product.dias_para_vencer} días
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          {(product.caracteristicas_tecnicas || product.normas_aplicacion || product.laboratorio) && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-medium text-gray-900 mb-4">Especificaciones Técnicas</h3>
              <div className="space-y-3 text-sm">
                {product.caracteristicas_tecnicas && (
                  <div>
                    <span className="font-medium text-gray-700">Características:</span>
                    <p className="mt-1 text-gray-600">{product.caracteristicas_tecnicas}</p>
                  </div>
                )}
                {product.normas_aplicacion && (
                  <div>
                    <span className="font-medium text-gray-700">Normas de Aplicación:</span>
                    <p className="mt-1 text-gray-600">{product.normas_aplicacion}</p>
                  </div>
                )}
                {product.laboratorio && (
                  <div>
                    <span className="font-medium text-gray-700">Laboratorio:</span>
                    <p className="mt-1 text-gray-600">{product.laboratorio}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Client Information */}
          {client && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Información del Titular
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Razón Social:</span>
                  <p className="mt-1">{client.razon_social}</p>
                </div>
                {client.nombre_comercial && (
                  <div>
                    <span className="font-medium text-gray-700">Nombre Comercial:</span>
                    <p className="mt-1">{client.nombre_comercial}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">CUIT:</span>
                  <p className="mt-1">{client.cuit}</p>
                </div>
                {client.domicilio_legal && (
                  <div>
                    <span className="font-medium text-gray-700">Domicilio:</span>
                    <p className="mt-1">{client.domicilio_legal}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Certification Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-medium text-gray-900 mb-4">Estado de Certificación</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getDjcStatusColor(product.djc_status)}`}>
                    {product.djc_status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Declaración Jurada</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                    product.certificado_status === 'Subido' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}>
                    {product.certificado_status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Certificado</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="mb-2">
                  <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">Verificado</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">
              Esta información ha sido verificada y es válida al momento de la consulta.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Generado el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPassport;