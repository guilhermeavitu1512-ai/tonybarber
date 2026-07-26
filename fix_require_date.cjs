const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

code = code.replace(/const \{ parseISO \} = require\('date-fns'\);/g, '');

fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
