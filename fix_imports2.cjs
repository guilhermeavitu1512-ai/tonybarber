const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const lines = code.split('\n');
const fixedLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  if (i > 200 && lines[i].startsWith("import { Link, useLocation")) {
    skip = true;
  }
  
  if (!skip) {
    fixedLines.push(lines[i]);
  }
  
  if (skip && lines[i].startsWith("import { generateAvailableSlots")) {
    skip = false;
  }
}

fs.writeFileSync('src/pages/public/BookingFlow.tsx', fixedLines.join('\n'));
