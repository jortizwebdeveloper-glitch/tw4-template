#!/usr/bin/env node

/**
 * my-tailwind-boilerplate
 * Agrega tu CSS custom al proyecto Next.js actual
 *
 * Uso: npx github:tu-usuario/my-tailwind-boilerplate
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

// ─── CONFIG ───────────────────────────────────────────────────────────────────


const GITHUB_USER = 'jortizwebdeveloper-glitch';
const GITHUB_REPO = 'tw4-template';
const GITHUB_BRANCH = 'main';

// Archivos CSS a descargar (podés agregar más)
const CSS_FILES = [
  {
    src: `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/styles/custom.css`,
    target: 'app/globals.css',   // relativo al proyecto Next.js
    mode: 'append',              // 'append' | 'prepend' | 'replace' | 'new-file'
  },
  // Ejemplo: crear archivo separado para componentes
  // {
  //   src: `https://raw.githubusercontent.com/...`,
  //   target: 'app/components.css',
  //   mode: 'new-file',
  // },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────

const log = {
  info:    (msg) => console.log(`\x1b[36mℹ\x1b[0m  ${msg}`),
  success: (msg) => console.log(`\x1b[32m✔\x1b[0m  ${msg}`),
  warn:    (msg) => console.log(`\x1b[33m⚠\x1b[0m  ${msg}`),
  error:   (msg) => console.error(`\x1b[31m✖\x1b[0m  ${msg}`),
};

function fetchContent(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Manejo de redirect
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchContent(res.headers.location).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} al descargar: ${url}`));
      }

      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log.info(`Carpeta creada: ${dir}`);
  }
}

function applyCSS(targetPath, newContent, mode) {
  const absolutePath = path.join(process.cwd(), targetPath);
  ensureDir(absolutePath);

  const separator = `\n/* ── my-tailwind-boilerplate ── */\n`;

  switch (mode) {
    case 'append': {
      const existing = fs.existsSync(absolutePath)
        ? fs.readFileSync(absolutePath, 'utf8')
        : '';
      fs.writeFileSync(absolutePath, existing + separator + newContent);
      log.success(`Appended → ${targetPath}`);
      break;
    }

    case 'prepend': {
      const existing = fs.existsSync(absolutePath)
        ? fs.readFileSync(absolutePath, 'utf8')
        : '';
      fs.writeFileSync(absolutePath, newContent + separator + existing);
      log.success(`Prepended → ${targetPath}`);
      break;
    }

    case 'replace': {
      fs.writeFileSync(absolutePath, newContent);
      log.success(`Replaced → ${targetPath}`);
      break;
    }

    case 'new-file': {
      if (fs.existsSync(absolutePath)) {
        log.warn(`Ya existe ${targetPath}, saltando...`);
      } else {
        fs.writeFileSync(absolutePath, newContent);
        log.success(`Creado → ${targetPath}`);
      }
      break;
    }

    default:
      throw new Error(`Modo inválido: "${mode}". Usá: append | prepend | replace | new-file`);
  }
}

// ─── VALIDACIONES ─────────────────────────────────────────────────────────────

function validateNextProject() {
  const pkgPath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(pkgPath)) {
    log.error('No encontré package.json. ¿Estás en la raíz de tu proyecto Next.js?');
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const hasNext = pkg.dependencies?.next || pkg.devDependencies?.next;

  if (!hasNext) {
    log.warn('No detecté Next.js en las dependencias. Continuando de todas formas...');
  } else {
    log.info(`Next.js detectado: ${pkg.dependencies?.next || pkg.devDependencies?.next}`);
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n\x1b[1m🎨 my-tailwind-boilerplate\x1b[0m\n');

  validateNextProject();

  for (const file of CSS_FILES) {
    log.info(`Descargando ${file.src}...`);

    try {
      const content = await fetchContent(file.src);
      applyCSS(file.target, content, file.mode);
    } catch (err) {
      log.error(`Error con ${file.target}: ${err.message}`);
      process.exit(1);
    }
  }

  console.log('\n\x1b[32m\x1b[1m✔ Listo! Tu CSS custom fue aplicado.\x1b[0m\n');
}

main();
