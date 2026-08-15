/**
 * KFC Fried Chicken Landing Page — SQLite Database Manager
 *
 * Ưu tiên:
 *   1. Gọi POST /api/orders → server.js ghi trực tiếp vào data/orders.db trên ổ cứng
 *      (Yêu cầu chạy:  node server.js  rồi mở http://localhost:3000)
 *   2. Fallback: client-side sql.js (WebAssembly) + IndexedDB nếu server không có
 */

const SQLiteService = {
  db: null,       // sql.js Database instance (client-side WASM)
  SQL: null,      // sql.js constructor
  _initPromise: null,

  DB_NAME: 'KFC_Orders_Database',
  STORE_NAME: 'sqlite_files',
  FILE_KEY: 'orders.db',

  // ---------- KHỞI TẠO ----------
  async init() {
    if (this._initPromise) return this._initPromise;      // tránh gọi lại nhiều lần
    this._initPromise = this._doInit();
    return this._initPromise;
  },

  async _doInit() {
    try {
      if (typeof initSqlJs === 'undefined') {
        console.warn('[SQLiteService] sql.js chưa load.');
        return false;
      }

      this.SQL = await initSqlJs({
        locateFile: file =>
          `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
      });

      const savedBytes = await this._loadFromIndexedDB();
      if (savedBytes && savedBytes.length > 0) {
        try {
          this.db = new this.SQL.Database(savedBytes);
          console.log('[SQLiteService] Khôi phục CSDL từ IndexedDB thành công.');
        } catch {
          this.db = new this.SQL.Database();
        }
      } else {
        this.db = new this.SQL.Database();
        console.log('[SQLiteService] Khởi tạo CSDL mới trong trình duyệt.');
      }

      this._createTables();
      return true;
    } catch (err) {
      console.error('[SQLiteService] Lỗi khởi tạo:', err);
      return false;
    }
  },

  // ---------- TẠO BẢNG ----------
  _createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        order_code       TEXT    UNIQUE NOT NULL,
        customer_name    TEXT    NOT NULL,
        customer_phone   TEXT    NOT NULL,
        customer_address TEXT    NOT NULL,
        note             TEXT,
        payment_method   TEXT    DEFAULT 'COD',
        subtotal         REAL    NOT NULL,
        discount_amount  REAL    DEFAULT 0,
        shipping_fee     REAL    DEFAULT 0,
        total_amount     REAL    NOT NULL,
        promo_code       TEXT,
        status           TEXT    DEFAULT 'COMPLETED',
        created_at       TEXT    DEFAULT (datetime('now','localtime'))
      );
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id     INTEGER NOT NULL,
        product_id   TEXT    NOT NULL,
        product_name TEXT    NOT NULL,
        price        REAL    NOT NULL,
        quantity     INTEGER NOT NULL,
        item_total   REAL    NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
      );
    `);
    // migration: thêm cột mới nếu database cũ chưa có
    try { this.db.run("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'COD';"); } catch {}
    this._saveToIndexedDB();
  },

  // ---------- LƯU ĐƠN HÀNG ----------
  async saveOrder(customerInfo, cartSummary, cartItems) {
    const orderCode = `KFC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // --- Nhánh 1: Server API (node server.js đang chạy) ---
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerInfo, cartSummary, cartItems })
      });

      if (response.ok) {
        const apiData = await response.json();
        if (apiData.success) {
          console.log(`[SQLiteService] 💾 Đã lưu ${apiData.orderCode} vào data/orders.db (server-side).`);
          // Đồng bộ client-side để Receipt có thể đọc dữ liệu ngay
          await this._clientSaveFallback(customerInfo, cartSummary, cartItems, apiData.orderCode);
          return {
            orderId:       apiData.orderId,
            orderCode:     apiData.orderCode,
            paymentMethod: customerInfo.paymentMethod || 'COD',
            customerInfo,
            cartSummary,
            cartItems
          };
        }
      }
    } catch (netErr) {
      console.warn('[SQLiteService] Server không khả dụng, dùng IndexedDB fallback:', netErr.message);
    }

    // --- Nhánh 2: Client-side IndexedDB fallback ---
    return this._clientSaveFallback(customerInfo, cartSummary, cartItems, orderCode);
  },

  // ---------- FALLBACK CLIENT-SIDE (sql.js + IndexedDB) ----------
  async _clientSaveFallback(customerInfo, cartSummary, cartItems, orderCode) {
    // Đảm bảo sql.js đã init xong trước khi ghi
    const ok = await this.init();
    if (!ok || !this.db) {
      throw new Error('Không thể khởi tạo CSDL cục bộ (sql.js).');
    }

    const paymentMethod = customerInfo.paymentMethod || 'COD';

    this.db.run('BEGIN TRANSACTION;');

    const insertOrder = this.db.prepare(`
      INSERT INTO orders (
        order_code, customer_name, customer_phone, customer_address,
        note, payment_method, subtotal, discount_amount, shipping_fee,
        total_amount, promo_code, status
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);
    `);
    insertOrder.run([
      orderCode,
      customerInfo.name    || 'Khách hàng',
      customerInfo.phone   || '',
      customerInfo.address || '',
      customerInfo.note    || '',
      paymentMethod,
      cartSummary.subtotal,
      cartSummary.discountAmount,
      cartSummary.shipping,
      cartSummary.finalTotal,
      customerInfo.promoCode || '',
      'COMPLETED'
    ]);
    insertOrder.free();

    const idRes  = this.db.exec('SELECT last_insert_rowid() AS id;');
    const orderId = idRes[0].values[0][0];

    const insertItem = this.db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity, item_total)
      VALUES (?,?,?,?,?,?);
    `);
    for (const item of cartItems) {
      insertItem.run([orderId, item.id, item.name, item.price, item.quantity, item.price * item.quantity]);
    }
    insertItem.free();

    this.db.run('COMMIT;');
    await this._saveToIndexedDB();

    console.log(`[SQLiteService] ✅ Đã lưu ${orderCode} vào IndexedDB (client-side fallback).`);
    return { orderId, orderCode, paymentMethod, customerInfo, cartSummary, cartItems };
  },

  // ---------- INDEXEDDB HELPERS ----------
  _saveToIndexedDB() {
    return new Promise((resolve) => {
      if (!this.db) return resolve(false);
      try {
        const bytes = this.db.export();
        const req = indexedDB.open(this.DB_NAME, 1);
        req.onupgradeneeded = e => {
          if (!e.target.result.objectStoreNames.contains(this.STORE_NAME))
            e.target.result.createObjectStore(this.STORE_NAME);
        };
        req.onsuccess = e => {
          const tx    = e.target.result.transaction(this.STORE_NAME, 'readwrite');
          const store = tx.objectStore(this.STORE_NAME);
          store.put(bytes, this.FILE_KEY);
          tx.oncomplete = () => resolve(true);
          tx.onerror    = () => resolve(false);
        };
        req.onerror = () => resolve(false);
      } catch { resolve(false); }
    });
  },

  _loadFromIndexedDB() {
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(this.DB_NAME, 1);
        req.onupgradeneeded = e => {
          if (!e.target.result.objectStoreNames.contains(this.STORE_NAME))
            e.target.result.createObjectStore(this.STORE_NAME);
        };
        req.onsuccess = e => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.STORE_NAME)) return resolve(null);
          const get = db.transaction(this.STORE_NAME, 'readonly').objectStore(this.STORE_NAME).get(this.FILE_KEY);
          get.onsuccess = () => resolve(get.result ? new Uint8Array(get.result) : null);
          get.onerror   = () => resolve(null);
        };
        req.onerror = () => resolve(null);
      } catch { resolve(null); }
    });
  },

  // ---------- XUẤT FILE (tùy chọn) ----------
  exportDatabaseFile() {
    if (!this.db) return;
    const blob = new Blob([this.db.export()], { type: 'application/x-sqlite3' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'orders.db' });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

// Khởi tạo sớm khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => SQLiteService.init());
