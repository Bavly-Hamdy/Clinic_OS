const fs = require('fs');
const files = [
  'c:/Users/Bavly Hamdy/Downloads/clinic-flow-main/src/pages/doctor/SettingsPage.tsx',
  'c:/Users/Bavly Hamdy/Downloads/clinic-flow-main/src/pages/receptionist/QueuePage.tsx',
  'c:/Users/Bavly Hamdy/Downloads/clinic-flow-main/src/pages/receptionist/ShiftClosePage.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\bmr-(\d+|px|auto)\b/g, 'me-');
  content = content.replace(/\bml-(\d+|px|auto)\b/g, 'ms-');
  content = content.replace(/\bpr-(\d+|px|auto)\b/g, 'pe-');
  content = content.replace(/\bpl-(\d+|px|auto)\b/g, 'ps-');
  content = content.replace(/\btext-left\b/g, 'text-start');
  content = content.replace(/\btext-right\b/g, 'text-end');
  content = content.replace(/\bleft-(\d+|px|1\/2|1\/3|2\/3|1\/4|3\/4|full)\b/g, 'start-');
  content = content.replace(/\bright-(\d+|px|1\/2|1\/3|2\/3|1\/4|3\/4|full)\b/g, 'end-');
  content = content.replace(/-left-(\d+|px|1\/2|1\/3|full|24)\b/g, '-start-');
  content = content.replace(/-right-(\d+|px|1\/2|1\/3|full|24)\b/g, '-end-');
  content = content.replace(/\bborder-r(\s|\/)/g, 'border-e');
  content = content.replace(/\bborder-l(\s|\/)/g, 'border-s');
  
  fs.writeFileSync(file, content, 'utf8');
});
console.log('Done replacing tailwind classes');
