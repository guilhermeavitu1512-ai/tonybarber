const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

const targetAddress = `const address = locationData ? \`\${locationData.name}\\n\${locationData.address}\\nCEP \${locationData.postalCode}\\n\${locationData.country}\` : 'Endereço não configurado';`;

const newAddress = `const address = locationData ? \`\${locationData.name}\\n\${locationData.street}, nº \${locationData.number} — \${locationData.reference}\\n\${locationData.city} — \${locationData.stateCode}\\nCEP \${locationData.postalCode}\` : 'Endereço não configurado';`;

code = code.split(targetAddress).join(newAddress);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', code);
