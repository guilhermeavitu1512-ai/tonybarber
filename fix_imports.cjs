const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const errorImportsStart = `import { Link, useLocation, useSearchParams } from 'react-router-dom';`;

if (code.indexOf(errorImportsStart) > 1000) {
  // Found them in the middle of the file
  const endImportsStr = `import { generateAvailableSlots } from '../../lib/booking';`;
  
  // Find the exact chunk
  const startIndex = code.indexOf(errorImportsStart);
  const endIndex = code.indexOf(endImportsStr, startIndex) + endImportsStr.length;
  
  const badChunk = code.substring(startIndex, endIndex);
  console.log("Found bad chunk starting at", startIndex);
  
  // Remove it from there
  code = code.substring(0, startIndex) + code.substring(endIndex);
  
  // Prepend to top of file
  code = badChunk + '\n' + code;
  
  fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
}
