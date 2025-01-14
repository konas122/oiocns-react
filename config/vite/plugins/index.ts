/**
 * vite plugin
 */

import legacy from '@vitejs/plugin-legacy';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
// @vitejs/plugin-react-refresh 已被启用
// 使用 @vitejs/plugin-react代替
import react from '@vitejs/plugin-react';

export function createVitePlugins(viteEnv: string, isBuild: boolean) {
  return [
    react(), 
    monacoEditorPlugin({
    }),
    ... isBuild ? [legacy()] : []
  ];
}
