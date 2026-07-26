const fs = require('fs');
const content = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');
const start = content.indexOf('{/* STEP 4: CUSTOMER DETAILS */}');
const end = content.indexOf('{/* STEP 5: WAITLIST */}');
console.log(content.substring(start, end));
