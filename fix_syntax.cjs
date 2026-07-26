const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminInventory.tsx', 'utf8');
code = code.replace(/reason: reason \|\| \\`\\\\\${mType} manual\\`/g, "reason: reason || `${mType} manual`");
fs.writeFileSync('src/pages/admin/AdminInventory.tsx', code);
