const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

code = code.replace(/locationData\?\.phone/g, 'BARBERSHOP_LOCATION?.whatsapp');
code = code.replace(/locationData\?\.whatsapp/g, 'BARBERSHOP_LOCATION?.whatsapp');

fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
