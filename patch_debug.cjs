const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const anchor = `                      getSmartUpsellProducts(dbProducts.filter(p => p.isActive), recommendations, selectedService?.id || '', [], [], []).map((product, idx) => {`;
const newAnchor = `                      getSmartUpsellProducts(dbProducts.filter(p => p.isActive), recommendations, selectedService?.id || '', [], [], []).map((product, idx) => {
console.log("[UPSELL PRODUCT RENDER]", product);`;

code = code.replace(anchor, newAnchor);
fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
