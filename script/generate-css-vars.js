/*

const fs = require('fs');
const path = require('path');

const SCSS_DIR = path.resolve(process.cwd(), 'styles'); // путь до папки с твоими scss файлами
const OUTPUT_FILE = path.resolve(process.cwd(), '.vscode/css-variables.json');

const varRegex = /--([\w-]+)\s*:\s*([^;]+);/g;

const cssVars = new Set();

function extractVariablesFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  while ((match = varRegex.exec(content)) !== null) {
    cssVars.add({
      name: `--${match[1].trim()}`,
      description: '',
      values: [match[2].trim()]
    });
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.scss')) {
      extractVariablesFromFile(fullPath);
    }
  }
}

walkDir(SCSS_DIR);

const output = {
  version: 1,
  properties: Array.from(cssVars)
};

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log('✅ CSS variables extracted to .vscode/css-variables.json');

*/
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const scssFile = path.resolve(process.cwd(), 'styles/_variables.scss');;
// --- Функция парсинга и обновления ---
function updateCssVars() {
  console.log('⏳ Начинаю обработку файла', scssFile);
  let scssContent;
  try {
    scssContent = fs.readFileSync(scssFile, 'utf8');
  } catch (e) {
    console.error('❌ Не могу прочитать файл:', e.message);
    return;
  }

// 1. Ищем SCSS-переменные с пометкой /* dubbed */
const scssVars = {};
const scssVarRegex = /\$([a-zA-Z0-9_-]+):\s*([^;]+);\s*\/\*\s*dubbed\s*\*\//g;
let match;

while ((match = scssVarRegex.exec(scssContent)) !== null) {
    const [_, name, value] = match;
    scssVars[name] = value.trim();
}

if (Object.keys(scssVars).length === 0) {
  console.log('🤷 Нет переменных с комментарием dubbed для обработки.');
  return;
}

// 2. Парсим существующий :root (игнорируя @include)
const rootBlock = extractRootBlock(scssContent);
const existingCssVars = new Set();

if (rootBlock) {
    const cssVarRegex = /--[a-zA-Z0-9_-]+:\s*#\{\$([a-zA-Z0-9_-]+)\}/g;
    let cssVarMatch;

    while ((cssVarMatch = cssVarRegex.exec(rootBlock.content)) !== null) {
        existingCssVars.add(cssVarMatch[1]); // добавляем только имя SCSS-переменной
    }
}

  // 4. Формируем новые CSS-переменные для добавления
  let newCssVarsContent = '';
  for (const [name, value] of Object.entries(scssVars)) {
    if (!existingCssVars.has(name)) {
      newCssVarsContent += `    --${name}: #{$${name}};\n`;
    }
  }

  if (!newCssVarsContent) {
    console.log('✅ Все CSS-переменные уже присутствуют. Добавлять нечего.');
    return;
  }

  // 5. Вставляем новые переменные аккуратно
  if (rootBlock) {
    const updatedRootContent = insertVarsBeforeNestedBlock(rootBlock, newCssVarsContent);
    const newScssContent = scssContent.replace(rootBlock.fullMatch, updatedRootContent);

    try {
      fs.writeFileSync(scssFile, newScssContent, 'utf8');
      console.log('✅ Успешно добавлены новые CSS-переменные:', Object.keys(scssVars).filter(n => !existingCssVars.has(n)).join(', '));
    } catch (e) {
      console.error('❌ Ошибка записи файла:', e.message);
    }
  } else {
    // Если :root нет, добавим в конец файла
    const appended = `\n:root {\n${newCssVarsContent}}\n`;
    try {
      fs.appendFileSync(scssFile, appended, 'utf8');
      console.log('✅ Добавлен новый блок :root с CSS-переменными:', Object.keys(scssVars).join(', '));
    } catch (e) {
      console.error('❌ Ошибка записи файла:', e.message);
    }
  }
}


// Вырезает только верхний уровень :root {}, игнорируя @include
function extractRootBlock(content) {
    const rootStart = content.indexOf(':root');
    if (rootStart === -1) return null;

    const openBraceIndex = content.indexOf('{', rootStart);
    if (openBraceIndex === -1) return null;

    let i = openBraceIndex + 1;
    let level = 1;

    while (i < content.length) {
        if (content[i] === '{') level++;
        else if (content[i] === '}') level--;

        if (level === 0) break;
        i++;
    }

    const rootEnd = i + 1;
    const fullMatch = content.slice(rootStart, rootEnd);
    const bodyOnly = fullMatch.slice(fullMatch.indexOf('{') + 1, fullMatch.lastIndexOf('}'));

    return {
        fullMatch,
        content: bodyOnly.trim(),
        start: rootStart,
        end: rootEnd
    };
}
function insertVarsBeforeNestedBlock(rootBlock, newCssVarsContent) {
  const lines = rootBlock.content.split('\n');
  let insertIndex = lines.length; // по умолчанию — в конец

  for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('@') && line.includes('{')) {
          insertIndex = i;
          break;
      }
  }

  const updatedLines = [
      ...lines.slice(0, insertIndex),
      newCssVarsContent.trimEnd(),
      '',
      ...lines.slice(insertIndex)
  ];

  return `:root {\n${updatedLines.join('\n')}\n}`;
}

// --- Запуск watcher ---

const watcher = chokidar.watch(scssFile, {
  persistent: true,
  ignoreInitial: false,
  awaitWriteFinish: {
    stabilityThreshold: 200,
    pollInterval: 100
  }
});

console.log(`👀 Запускаю watcher для: ${scssFile}`);

watcher.on('change', pathChanged => {
  console.log(`⚡ Файл изменён: ${pathChanged}`);
  updateCssVars();
});