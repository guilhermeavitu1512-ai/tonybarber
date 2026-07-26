const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');
code = code.replace(
"    // Default deny for everything else\n    match /{document=**} {\n      allow read, write: if isAdmin();\n    }",
"    match /daily_schedules/{id} {\n      allow read, write: if true;\n    }\n\n    // Default deny for everything else\n    match /{document=**} {\n      allow read, write: if isAdmin();\n    }"
);
fs.writeFileSync('firestore.rules', code);
