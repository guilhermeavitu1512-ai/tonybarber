const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const anchor = `  useEffect(() => {
    async function loadInitialData() {`;
const newAnchor = `  useEffect(() => {
    loadProducts(); // Call loadProducts to fetch products specifically with loading state
    async function loadInitialData() {`;
code = code.replace(anchor, newAnchor);

fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
