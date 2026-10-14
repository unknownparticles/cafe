import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Pages 项目站点与开发环境统一使用子路径，提前发现资源路径问题。
export default defineConfig({ plugins: [react()], base: '/cafe/' });
