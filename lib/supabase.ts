
import { createClient } from '@supabase/supabase-js';

const getCredentials = () => {
  // Verificación segura de variables de entorno para evitar errores fatales en el navegador
  const isProcessDefined = typeof process !== 'undefined' && process.env;
  
  const url = (isProcessDefined ? process.env.SUPABASE_URL : null)
    || localStorage.getItem('ST3D_SUPABASE_URL') 
    || "https://dzapbmqthpbrjguzuoki.supabase.co";
    
  const key = (isProcessDefined ? process.env.SUPABASE_ANON_KEY : null)
    || localStorage.getItem('ST3D_SUPABASE_KEY') 
    || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6YXBibXF0aHBicmpndXp1b2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTc2MDgsImV4cCI6MjA4NTczMzYwOH0.lk8kw04c_nJo8JbADh2pYl7KUY1eNKUas351jmx-9Ic";

  return { url, key };
};

const { url, key } = getCredentials();

export const supabase = createClient(url, key);

export const saveSupabaseCredentials = (url: string, key: string) => {
  localStorage.setItem('ST3D_SUPABASE_URL', url);
  localStorage.setItem('ST3D_SUPABASE_KEY', key);
  window.location.reload();
};
