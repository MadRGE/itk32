import QRCode from 'qrcode';
import { supabase } from '../lib/supabase';

export interface QRGenerationResult {
  success: boolean;
  qrPath?: string;
  qrLink?: string;
  error?: string;
}

/**
 * Genera un código QR como data URL
 */
export async function generateQRCodeDataUrl(url: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      type: 'image/png',
      width: 1000, // Alta resolución para calidad
      margin: 1,
      errorCorrectionLevel: 'H', // Máxima corrección de errores
      color: {
        dark: '#000000', // Módulos negros
        light: '#ffffff' // Fondo blanco
      }
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code data URL:', error);
    throw new Error('Failed to generate QR code image.');
  }
}

/**
 * Convierte un data URL a Blob
 */
export function dataURLToBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Sube un código QR a Supabase Storage
 */
export async function uploadQRCodeToStorage(
  codificacion: string, 
  qrBlob: Blob
): Promise<{ path: string; publicUrl: string }> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const fileName = `qr_${codificacion}_${Date.now()}.png`;
  const filePath = `qr/${fileName}`;

  const { data, error } = await supabase.storage
    .from('qrs')
    .upload(filePath, qrBlob, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) {
    throw new Error(`Error subiendo QR a Storage: ${error.message}`);
  }

  // Obtener URL pública
  const { data: publicUrlData } = supabase.storage
    .from('qrs')
    .getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: publicUrlData.publicUrl
  };
}

/**
 * Actualiza el producto con la información del QR generado
 */
export async function updateProductWithQRInfo(
  codificacion: string,
  qrPath: string,
  qrLink: string
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { error } = await supabase
    .from('products')
    .update({
      qr_path: qrPath,
      qr_link: qrLink,
      qr_generado: true,
      qr_version: '1.0',
      qr_generated_at: new Date().toISOString()
    })
    .eq('codificacion', codificacion);

  if (error) {
    throw new Error(`Error actualizando producto con info QR: ${error.message}`);
  }
}

/**
 * Función principal para generar QR completo para un producto
 */
export async function generateQRForProduct(codificacion: string): Promise<QRGenerationResult> {
  try {
    // 1. Generar la URL del producto
    const productUrl = `${window.location.origin}/product/${codificacion}`;
    
    // 2. Generar el código QR
    const qrDataUrl = await generateQRCodeDataUrl(productUrl);
    
    // 3. Convertir a Blob
    const qrBlob = dataURLToBlob(qrDataUrl);
    
    // 4. Subir a Supabase Storage
    const { path, publicUrl } = await uploadQRCodeToStorage(codificacion, qrBlob);
    
    // 5. Actualizar el producto en la base de datos
    await updateProductWithQRInfo(codificacion, path, productUrl);
    
    return {
      success: true,
      qrPath: path,
      qrLink: productUrl
    };
  } catch (error) {
    console.error('Error en generateQRForProduct:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Registra un escaneo de QR en la tabla qr_scans
 */
export async function logQRScan(
  productCodificacion: string,
  userAgent?: string,
  referrer?: string
): Promise<void> {
  if (!supabase) {
    console.warn('Supabase no configurado - no se puede registrar escaneo');
    return;
  }

  try {
    const { error } = await supabase
      .from('qr_scans')
      .insert({
        product_codificacion: productCodificacion,
        user_agent: userAgent || navigator.userAgent,
        referrer: referrer || document.referrer,
        // ip_address se puede obtener del servidor si es necesario
      });

    if (error) {
      console.error('Error registrando escaneo QR:', error);
    }
  } catch (error) {
    console.error('Error en logQRScan:', error);
  }
}