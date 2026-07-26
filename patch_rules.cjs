const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');
code = code.replace(
  "    match /inventory_movements/{id} {\n      allow read, write: if isAdmin();\n    }",
  "    match /inventory_movements/{id} {\n      allow create: if true;\n      allow read, update, delete: if isAdmin();\n    }"
);
code = code.replace(
  "    match /products/{id} {\n      allow read: if true;\n      allow write: if isAdmin();\n    }",
  "    match /products/{id} {\n      allow read: if true;\n      allow update: if true;\n      allow create, delete: if isAdmin();\n    }"
);
const lastBraceIndex = code.lastIndexOf("}");
code = code.substring(0, lastBraceIndex) + `    match /daily_schedules/{id} {\n      allow read, write: if true;\n    }\n  }\n}`;
fs.writeFileSync('firestore.rules', code);
