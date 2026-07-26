const fs = require('fs');
const content = `import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

// Create Express App
const app = express();
app.use(express.json());
const PORT = 3000;

// API routes go here FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Setup Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const actualDistPath = path.join(process.cwd(), 'dist');
    app.use(express.static(actualDistPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(actualDistPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

startServer();
`;
fs.writeFileSync('server.ts', content);
