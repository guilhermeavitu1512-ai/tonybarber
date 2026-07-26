const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

code = code.split('import.meta.env').join('(import.meta as any).env');

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', code);
