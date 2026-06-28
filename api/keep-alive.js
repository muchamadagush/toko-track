import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Verifikasi token Vercel Cron jika CRON_SECRET dikonfigurasi
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({
      success: false,
      message: 'Missing Supabase environment variables.',
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Melakukan query minimal untuk menstimulasi database Supabase agar tidak di-pause
    const { data, error } = await supabase.from('categories').select('id').limit(1);

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Supabase keep-alive successful.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to query Supabase.',
      error: error.message,
    });
  }
}
