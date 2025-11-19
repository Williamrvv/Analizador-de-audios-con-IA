const esbuild = require('esbuild');
require('dotenv').config();

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.warn('⚠️  ADVERTENCIA: No se encontró la variable de entorno API_KEY.');
  console.warn('   Asegúrate de crear un archivo .env en la raíz con el contenido: API_KEY=tu_clave_aqui');
} else {
  console.log('✅ API_KEY encontrada e inyectada en la compilación.');
}

esbuild.build({
  entryPoints: ['index.tsx'],
  bundle: true,
  outfile: 'dist/bundle.js',
  jsx: 'automatic',
  loader: { '.ts': 'tsx' },
  define: {
    'process.env.API_KEY': JSON.stringify(apiKey || ''),
  },
}).catch(() => process.exit(1));