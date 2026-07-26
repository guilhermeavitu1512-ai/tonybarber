const fs = require('fs');

let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');
code = code.replace(
  /const \[availableSlots, setAvailableSlots\] = useState<Date\[\]>\(\[\]\);/g,
  "const [availableSlots, setAvailableSlots] = useState<Date[]>([]);\n  const [dbProducts, setDbProducts] = useState<any[]>([]);"
);
fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);

let landingCode = fs.readFileSync('src/pages/public/LandingPage.tsx', 'utf8');
landingCode = landingCode.replace(
  /const \[barbers, setBarbers\] = useState<Barber\[\]>\(\[\]\);/g,
  "const [barbers, setBarbers] = useState<Barber[]>([]);\n  const [featuredPackages, setFeaturedPackages] = useState<any[]>([]);"
);
fs.writeFileSync('src/pages/public/LandingPage.tsx', landingCode);
