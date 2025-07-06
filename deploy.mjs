import { execSync } from 'node:child_process';
import { rmSync, mkdirSync, cpSync } from 'node:fs';
import path from 'node:path';

const viteDist = path.resolve('./vite-build/dist');
const docs = path.resolve('./docs');

console.log('🧼 Чистим docs...');
rmSync(docs, { recursive: true, force: true });
mkdirSync(docs);

console.log('📦 Копируем билд из vite-build/dist...');
cpSync(viteDist, docs, { recursive: true });

console.log('🌀 Добавляем изменения в git...');
execSync('git add .', { stdio: 'inherit' }); // вот это важно

console.log('📤 Коммитим и пушим...');
execSync('git commit -m "deploy: обновлённый билд"', { stdio: 'inherit' });
execSync('git push', { stdio: 'inherit' });

console.log('✅ Готово! Деплой улетел на GitHub Pages!');
