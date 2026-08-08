import os
import sqlite3
import csv

DB_PATH = os.path.join(os.path.dirname(__file__), 'brew_lab.db')
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create Categories table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT
        )
    ''')

    # Create Products table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT,
            description TEXT,
            published_date TEXT,
            category_id INTEGER,
            is_featured INTEGER DEFAULT 0,
            FOREIGN KEY (category_id) REFERENCES categories (id)
        )
    ''')

    # Create Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create Reservations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            booking_date TEXT NOT NULL,
            time_slot TEXT NOT NULL,
            guests_count INTEGER NOT NULL,
            seating_area TEXT NOT NULL,
            note TEXT,
            status TEXT DEFAULT 'Đã xác nhận',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # Create Feedbacks table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS feedbacks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            rating INTEGER NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()

    # Seed categories if empty
    cursor.execute('SELECT COUNT(*) FROM categories')
    if cursor.fetchone()[0] == 0:
        cat_file = os.path.join(DATA_DIR, 'category.csv')
        if os.path.exists(cat_file):
            with open(cat_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    cursor.execute('''
                        INSERT INTO categories (id, name, description)
                        VALUES (?, ?, ?)
                    ''', (int(row['id']), row['name'], row.get('description', '')))

    # Seed products if empty
    cursor.execute('SELECT COUNT(*) FROM products')
    if cursor.fetchone()[0] == 0:
        prod_file = os.path.join(DATA_DIR, 'product.csv')
        if os.path.exists(prod_file):
            with open(prod_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                featured_names = ['ESPRESSO', 'LATTE', 'COLD BREW', 'MATCHA LATTE', 'BÁNH CROISSANT', 'PHIN ĐEN ĐÁ', 'BẠC XỈU ĐÁ', 'BÁNH TIRAMISU']
                for row in reader:
                    p_id = int(row['id'])
                    p_name = row['name'].strip()
                    p_price = float(row['price']) if row['price'] else 0.0
                    p_img = row['image'].strip() if row['image'] else ''
                    p_desc = row['description'].strip() if row['description'] else ''
                    p_date = row['published_date'].strip() if row['published_date'] else ''
                    p_cat_id = int(row['category_id']) if row['category_id'] else 1
                    
                    is_feat = 1 if any(fn in p_name.upper() for fn in featured_names) else 0

                    cursor.execute('''
                        INSERT INTO products (id, name, price, image, description, published_date, category_id, is_featured)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (p_id, p_name, p_price, p_img, p_desc, p_date, p_cat_id, is_feat))

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully.")
