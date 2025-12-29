import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // تحميل متغيرات البيئة لضمان عمل process.env.API_KEY
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // استبدال process.env.API_KEY بالقيمة الفعلية أثناء البناء
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  };
});