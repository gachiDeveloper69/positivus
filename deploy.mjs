import { execSync } from 'node:child_process';
import { rmSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve();
const viteDist = path.join(root, 'dist');
const docs = path.join(root, 'docs');

// 1. Чистим vite-build/dist
if (existsSync(viteDist)) {
  console.log('🧼 Чистим vite-build/dist...');
  rmSync(viteDist, { recursive: true, force: true });
}

// 2. Билдим Vite
console.log('⚙️ Билдим проект...');
execSync('npx vite build --config vite-build/vite.config.js', { stdio: 'inherit' });

// 3. Чистим docs/
if (existsSync(docs)) {
  console.log('🧹 Чистим docs...');
  rmSync(docs, { recursive: true, force: true });
}
mkdirSync(docs);

// 4. Копируем dist → docs
console.log('📦 Копируем билд в docs...');
cpSync(viteDist, docs, { recursive: true });

// 5. Git: add, commit, push
console.log('📤 Деплой в Git...');
execSync('git add .', { stdio: 'inherit' });
execSync('git commit -m "deploy: обновлённый билд"', { stdio: 'inherit' });
execSync('git push', { stdio: 'inherit' });

console.log('✅ Готово! Сайт задеплоен на GitHub Pages!');
