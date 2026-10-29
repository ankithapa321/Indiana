// server.js
import 'dotenv/config'; // This loads .env.local automatically
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(process.env.PORT || 3000, () => {
    console.log(`✅ SUCCESS: Server is running on http://localhost:3000`);
  });
}).catch((err) => {
  console.error("❌ SERVER CRASHED:", err);
  process.exit(1);
});