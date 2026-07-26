const fs = require('fs');

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  // Remove backslash before backtick
  code = code.replace(/\\`/g, "`");
  // Remove backslash before dollar sign
  code = code.replace(/\\\$/g, "$");
  fs.writeFileSync(file, code);
}

fixFile('src/pages/admin/AdminBarbers.tsx');
fixFile('src/pages/admin/AdminPackages.tsx');
fixFile('src/pages/admin/AdminInventory.tsx');
