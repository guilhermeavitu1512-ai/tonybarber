const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

code = code.replace(/opacity-\[0.35\] cursor-pointer/g, 'opacity-[0.35] cursor-not-allowed');

fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
