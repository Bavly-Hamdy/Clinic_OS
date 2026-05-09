const fs = require('fs');
const path = require('path');

const replacerMap = [
  { p: /\bml-([\d\.pxauto]+)\b/g, r: 'ms-$1' },
  { p: /\bmr-([\d\.pxauto]+)\b/g, r: 'me-$1' },
  { p: /\b-ml-([\d\.pxauto]+)\b/g, r: '-ms-$1' },
  { p: /\b-mr-([\d\.pxauto]+)\b/g, r: '-me-$1' },

  { p: /\bpl-([\d\.pxauto]+)\b/g, r: 'ps-$1' },
  { p: /\bpr-([\d\.pxauto]+)\b/g, r: 'pe-$1' },

  { p: /\bleft-([\d\.pxauto1-9\/full]+)\b/g, r: 'start-$1' },
  { p: /\bright-([\d\.pxauto1-9\/full]+)\b/g, r: 'end-$1' },
  { p: /\b-left-([\d\.pxauto1-9\/full]+)\b/g, r: '-start-$1' },
  { p: /\b-right-([\d\.pxauto1-9\/full]+)\b/g, r: '-end-$1' },

  { p: /\btext-left\b/g, r: 'text-start' },
  { p: /\btext-right\b/g, r: 'text-end' },

  { p: /\bborder-l\b/g, r: 'border-s' },
  { p: /\bborder-r\b/g, r: 'border-e' },
  { p: /\bborder-l-([\d\.px]+)\b/g, r: 'border-s-$1' },
  { p: /\bborder-r-([\d\.px]+)\b/g, r: 'border-e-$1' },

  { p: /\brounded-l-([\w]+)\b/g, r: 'rounded-s-$1' },
  { p: /\brounded-r-([\w]+)\b/g, r: 'rounded-e-$1' },
  { p: /\brounded-tl-([\w]+)\b/g, r: 'rounded-ss-$1' },
  { p: /\brounded-tr-([\w]+)\b/g, r: 'rounded-se-$1' },
  { p: /\brounded-bl-([\w]+)\b/g, r: 'rounded-es-$1' },
  { p: /\brounded-br-([\w]+)\b/g, r: 'rounded-ee-$1' },
  { p: /\brounded-l\b/g, r: 'rounded-s' },
  { p: /\brounded-r\b/g, r: 'rounded-e' },
];

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  replacerMap.forEach(({ p, r }) => {
    content = content.replace(p, r);
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

// Start processing the src directory
processDirectory('./src');
console.log('RTL Fixer: Completed replacing tailwind classes.');
