import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendDir=path.dirname(fileURLToPath(import.meta.url));
const legacyAdminCandidates=[
  path.resolve(frontendDir,'admin.html'),
  path.resolve(frontendDir,'../frontend-dist/admin.html'),
  path.resolve(frontendDir,'dist/admin.html'),
  path.resolve(frontendDir,'../frontend-dist/dist/admin.html')
];
const legacyAdminSource=legacyAdminCandidates.find(candidate=>fs.existsSync(candidate));
if(!legacyAdminSource)throw new Error('The existing admin dashboard shell could not be found.');
// Cache before Vite clears its output directory during a production build.
const legacyAdminMarkup=fs.readFileSync(legacyAdminSource,'utf8');
const adminAssetVersion='20260820-9';

function adminHtml(backendBase='',backendFallback=''){
  const primary=String(backendBase||'').trim().replace(/\/+$/, '');
  const fallback=String(backendFallback||'').trim().replace(/\/+$/, '');
  const runtimeConfig=`<link rel="preconnect" href="https://cdn.tailwindcss.com"><link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin><link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin><script>window.__EE_BACKEND_BASE_URL__=${JSON.stringify(primary).replace(/</g,'\\u003c')};window.__EE_BACKEND_FALLBACK_URL__=${JSON.stringify(fallback).replace(/</g,'\\u003c')};</script>`;
  return legacyAdminMarkup
    .replace(/<script>window\.__EE_BACKEND_BASE_URL__=[\s\S]*?<\/script>/g,'')
    .replace('<head>','<head>'+runtimeConfig)
    .replace('</head>','<link rel="stylesheet" href="/admin-mobile.css"></head>')
    .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js@4\.4\.0\/dist\/chart\.umd\.min\.js"><\/script>/,'<script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>')
    .replace(/(["'])\/?(?:\.\/)?(?:legacy\/)?assets\/css\/admin\.100012cefd\.css(?:\?v=[^"']*)?/g,`$1/legacy/assets/css/admin.100012cefd.css?v=${adminAssetVersion}`)
    .replace(/(["'])\/?(?:\.\/)?(?:legacy\/)?assets\/js\/admin\.9a74483567\.js(?:\?v=[^"']*)?/g,`$1/legacy/assets/js/admin.9a74483567.js?v=${adminAssetVersion}`)
    .replace(/<script src="(\/legacy\/assets\/js\/admin\.9a74483567\.js\?v=[^"]+)"><\/script>/,'<script defer src="$1"></script>');
}

function restoreAdminDashboard(backendBase,backendFallback){
  return {
    name:'restore-admin-dashboard',
    configureServer(server){
      server.middlewares.use(async(req,res,next)=>{
        const pathname=new URL(req.url||'/','http://localhost').pathname.replace(/\/+$/,'')||'/';
        if(pathname==='/admin/dealers'){
          res.statusCode=302; res.setHeader('Location','/admin'); res.end(); return;
        }
        if(pathname!=='/admin'&&pathname!=='/admin.html'&&pathname!=='/admin/products') return next();
        const html=await server.transformIndexHtml('/admin',adminHtml(backendBase,backendFallback));
        res.statusCode=200; res.setHeader('Content-Type','text/html; charset=utf-8'); res.end(html);
      });
    },
    writeBundle(options){
      const outDir=path.resolve(frontendDir,options.dir||'dist');
      const markup=adminHtml(backendBase,backendFallback);
      const adminDir=path.join(outDir,'admin');
      const productsDir=path.join(adminDir,'products');
      fs.mkdirSync(productsDir,{recursive:true});
      fs.writeFileSync(path.join(adminDir,'index.html'),markup,'utf8');
      fs.writeFileSync(path.join(productsDir,'index.html'),markup,'utf8');
    }
  };
}

export default defineConfig(({mode})=>{
  const env=loadEnv(mode,frontendDir,'');
  return {
    plugins:[react(),restoreAdminDashboard(env.VITE_BACKEND_BASE_URL||'',env.VITE_BACKEND_FALLBACK_URL||'')],
    resolve:{dedupe:['react','react-dom']},
    optimizeDeps:{include:['react','react-dom','react-dom/client','react/jsx-runtime']},
    // Vite's default production minifier is available in the bundled toolchain;
    // keep source maps disabled without requiring a separate esbuild package.
    build:{sourcemap:false}
  };
});
