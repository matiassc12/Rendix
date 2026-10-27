import { createClient } from '@supabase/supabase-js';

// Usar comillas simples o dobles para declarar la URL correctamente
const supabaseUrl = 'https://oijaqzqtsdpdazyodebt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pamFxenF0c2RwZGF6eW9kZWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMTEyODEsImV4cCI6MjEwODY4NzI4MX0.ut2rsUdkbn98q8ha_ujy6kqu9vLDEDE_uDmHXgn2bD8'; // Reemplaza esto con tu anon/public key de Supabase

export const supabase = createClient(supabaseUrl, supabaseAnonKey);