import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// 手动声明 process 类型，解决在没有 @types/node 时的构建报错 (TS2580)
declare const process: {
  cwd: () => string;
  env: Record<string, string | undefined>;
};

export default defineConfig(({ mode }) => {
  // 加载环境变量。第三个参数 '' 表示加载所有变量，不仅仅是 VITE_ 开头的
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      host: true
    },
    // 定义全局常量替换，确保 process.env.API_KEY 在浏览器端可用
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});