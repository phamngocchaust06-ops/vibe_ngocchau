/**
 * KFC Fried Chicken Landing Page — Local Server & SQLite Direct Disk Writer
 * Uses Node.js native `http` and `node:sqlite` modules (Zero external dependencies)
 * Automatically writes orders directly to `data/orders.db` on disk when orders are placed.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const PROJECT_DIR = __dirname;
const DB_PATH = path.join(PROJECT_DIR, 'data', 'orders.db');

// Ensure data/ directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Initialize SQLite Database File directly on disk
const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    note TEXT,
    payment_method TEXT DEFAULT 'COD',
    subtotal REAL NOT NULL,
    discount_amount REAL DEFAULT 0,
    shipping_fee REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    promo_code TEXT,
    status TEXT DEFAULT 'COMPLETED',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    item_total REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
  );
`);

console.log(`✅ SQLite Database file ready at: ${DB_PATH}`);

// MIME Types Map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.db': 'application/x-sqlite3'
};

// HTTP Server
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoint: POST /api/orders (Write directly to data/orders.db)
  if (req.url === '/api/orders' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { customerInfo, cartSummary, cartItems } = payload;

        const orderCode = `KFC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
        const paymentMethod = customerInfo.paymentMethod || 'COD';

        db.exec('BEGIN TRANSACTION;');

        const insertOrderStmt = db.prepare(`
          INSERT INTO orders (
            order_code, customer_name, customer_phone, customer_address,
            note, payment_method, subtotal, discount_amount, shipping_fee, total_amount, promo_code, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `);

        insertOrderStmt.run(
          orderCode,
          customerInfo.name || 'Khách hàng',
          customerInfo.phone || '',
          customerInfo.address || '',
          customerInfo.note || '',
          paymentMethod,
          cartSummary.subtotal,
          cartSummary.discountAmount,
          cartSummary.shipping,
          cartSummary.finalTotal,
          customerInfo.promoCode || '',
          'COMPLETED'
        );

        const row = db.prepare('SELECT last_insert_rowid() as id;').get();
        const orderId = row.id;

        const insertItemStmt = db.prepare(`
          INSERT INTO order_items (
            order_id, product_id, product_name, price, quantity, item_total
          ) VALUES (?, ?, ?, ?, ?, ?);
        `);

        for (const item of cartItems) {
          insertItemStmt.run(
            orderId,
            item.id,
            item.name,
            item.price,
            item.quantity,
            item.price * item.quantity
          );
        }

        db.exec('COMMIT;');

        console.log(`💾 Order ${orderCode} saved directly to data/orders.db on disk!`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          orderId,
          orderCode,
          message: 'Đã tự động lưu đơn hàng vào data/orders.db trên đĩa cứng máy tính!'
        }));
      } catch (err) {
        db.exec('ROLLBACK;');
        console.error('❌ Server SQLite Write Error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API Endpoint: GET /api/orders (Read from data/orders.db)
  if (req.url === '/api/orders' && req.method === 'GET') {
    try {
      const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC;').all();
      for (const order of orders) {
        order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?;').all(order.id);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, orders }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // Static File Serving
  let filePath = path.join(PROJECT_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  const extname = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 KFC Landing Page Server is running on: http://localhost:${PORT}`);
  console.log(`📂 SQLite Database file location: ${DB_PATH}\n`);
});
