import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({base:'/frc8712/',build:{rollupOptions:{input:{app:resolve(import.meta.dirname,'index.html'),nebula:resolve(import.meta.dirname,'nebula.html'),example:resolve(import.meta.dirname,'module-example.html')}}}});
