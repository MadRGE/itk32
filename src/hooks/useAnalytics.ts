import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export interface AnalyticsData {
  totalSyncs: number;
  totalValidations: number;
  totalGenerations: number;
  recentActivity: Array<{
    id: string;
    action_type: string;
    section: string;
    created_at: string;
    details: any;
  }>;
}

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSyncs: 0,
    totalValidations: 0,
    totalGenerations: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const logAction = async (actionType: string, section: string, details: any = {}) => {
    if (!supabase || !user) {
      console.log('Analytics disabled: No supabase or user');
      return;
    }

    // En desarrollo, no intentar guardar en analytics si no hay auth real
    if (user.id === '00000000-0000-0000-0000-000000000001') {
      console.log('Analytics disabled for development user');
      return;
    }

    try {
      const { error } = await supabase
        .from('analytics')
        .insert({
          user_id: user.id,
          action_type: actionType,
          section: section,
          details: details,
        });

      if (error) {
        console.error('Error logging action:', error.message);
        // No mostrar error al usuario, solo loggearlo
      }
    } catch (error) {
      console.error('Error logging action:', error);
      // No mostrar error al usuario, solo loggearlo
    }
  };

  const loadAnalytics = async () => {
    if (!supabase || !user || user.id === '00000000-0000-0000-0000-000000000001') {
      // Para usuarios de desarrollo, establecer datos mock
      setLoading(false);
      setAnalytics({
        totalSyncs: 5,
        totalValidations: 12,
        totalGenerations: 8,
        recentActivity: [
          {
            id: '1',
            action_type: 'validation',
            section: 'products',
            created_at: new Date().toISOString(),
            details: { totalRows: 150 }
          },
          {
            id: '2',
            action_type: 'sync',
            section: 'clients',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            details: { totalRows: 45 }
          }
        ]
      });
      return;
    }

    try {
      setLoading(true);

      // Obtener estadísticas
      const { data: syncData } = await supabase
        .from('analytics')
        .select('id')
        .eq('user_id', user.id)
        .eq('action_type', 'sync');

      const { data: validationData } = await supabase
        .from('analytics')
        .select('id')
        .eq('user_id', user.id)
        .eq('action_type', 'validation');

      const { data: generationData } = await supabase
        .from('analytics')
        .select('id')
        .eq('user_id', user.id)
        .eq('action_type', 'generation');

      // Obtener actividad reciente
      const { data: recentData } = await supabase
        .from('analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setAnalytics({
        totalSyncs: syncData?.length || 0,
        totalValidations: validationData?.length || 0,
        totalGenerations: generationData?.length || 0,
        recentActivity: recentData || [],
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  return {
    analytics,
    loading,
    logAction,
    reload: loadAnalytics,
  };
};

// Nueva función para registrar escaneos de QR
export const useQRAnalytics = () => {
  const logQRScan = async (
    productCodificacion: string,
    userAgent?: string,
    referrer?: string
  ): Promise<void> => {
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
      } else {
        console.log(`✅ Escaneo QR registrado para producto: ${productCodificacion}`);
      }
    } catch (error) {
      console.error('Error en logQRScan:', error);
    }
  };

  const getQRAnalytics = async (productCodificacion?: string) => {
    if (!supabase) {
      console.warn('Supabase no configurado');
      return null;
    }

    try {
      let query = supabase
        .from('qr_scans')
        .select('*')
        .order('scan_timestamp', { ascending: false });

      if (productCodificacion) {
        query = query.eq('product_codificacion', productCodificacion);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('Error obteniendo analíticas QR:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error en getQRAnalytics:', error);
      return null;
    }
  };

  return {
    logQRScan,
    getQRAnalytics,
  };
};