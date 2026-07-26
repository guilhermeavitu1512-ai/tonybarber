const fs = require('fs');

let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');
if (!code.includes('const [dbProducts')) {
  code = code.replace(
    /const \[availableSlots, setAvailableSlots\] = useState<\{ time: string, isAvailable: boolean \}\[\]>\(\[\]\);/g,
    "const [availableSlots, setAvailableSlots] = useState<{ time: string, isAvailable: boolean }[]>([]);\n  const [dbProducts, setDbProducts] = useState<any[]>([]);"
  );
  fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
}

let landingCode = fs.readFileSync('src/pages/public/LandingPage.tsx', 'utf8');
if (!landingCode.includes('const [featuredPackages')) {
  landingCode = landingCode.replace(
    /const \[location, setLocation\] = useState\(BARBERSHOP_LOCATION\);/g,
    "const [location, setLocation] = useState(BARBERSHOP_LOCATION);\n  const [featuredPackages, setFeaturedPackages] = useState<any[]>([]);"
  );
  fs.writeFileSync('src/pages/public/LandingPage.tsx', landingCode);
}
