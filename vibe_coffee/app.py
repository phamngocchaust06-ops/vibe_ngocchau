import os
import sqlite3
from flask import Flask, render_template, request, jsonify, session, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from database import init_db, get_db_connection

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'brew_lab_super_secret_key_2026')

# Initialize DB on startup
init_db()

@app.route('/images/<path:filename>')
def serve_images(filename):
    images_dir = os.path.join(app.root_path, 'images')
    return send_from_directory(images_dir, filename)

@app.route('/')
def index():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Fetch categories
    cursor.execute('SELECT * FROM categories ORDER BY id ASC')
    categories = [dict(row) for row in cursor.fetchall()]

    # Fetch initial products (limit or all)
    cursor.execute('''
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        ORDER BY p.id ASC
    ''')
    products = [dict(row) for row in cursor.fetchall()]

    # Fetch user info if logged in
    current_user = None
    if 'user_id' in session:
        cursor.execute('SELECT id, full_name, email, phone FROM users WHERE id = ?', (session['user_id'],))
        row = cursor.fetchone()
        if row:
            current_user = dict(row)

    conn.close()
    
    return render_template('index.html', categories=categories, products=products, current_user=current_user)

@app.route('/api/me', methods=['GET'])
def get_current_user():
    if 'user_id' in session:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id, full_name, email, phone FROM users WHERE id = ?', (session['user_id'],))
        row = cursor.fetchone()
        conn.close()
        if row:
            return jsonify({'logged_in': True, 'user': dict(row)})
    return jsonify({'logged_in': False})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')

    if not full_name or not email or not phone or not password:
        return jsonify({'success': False, 'message': 'Vui lòng điền đầy đủ tất cả thông tin.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({'success': False, 'message': 'Email này đã được đăng ký tài khoản.'}), 400

    password_hash = generate_password_hash(password)
    cursor.execute('''
        INSERT INTO users (full_name, email, phone, password_hash)
        VALUES (?, ?, ?, ?)
    ''', (full_name, email, phone, password_hash))
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    session['user_id'] = user_id
    session['user_name'] = full_name
    session['user_email'] = email

    return jsonify({
        'success': True,
        'message': 'Đăng ký tài khoản thành công! Bạn đã tự động đăng nhập.',
        'user': {'id': user_id, 'full_name': full_name, 'email': email, 'phone': phone}
    })

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Vui lòng nhập Email và Mật khẩu.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    conn.close()

    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'success': False, 'message': 'Email hoặc mật khẩu không chính xác.'}), 400

    session['user_id'] = user['id']
    session['user_name'] = user['full_name']
    session['user_email'] = user['email']

    return jsonify({
        'success': True,
        'message': f'Welcome back, {user["full_name"]}!',
        'user': {'id': user['id'], 'full_name': user['full_name'], 'email': user['email'], 'phone': user['phone']}
    })

@app.route('/api/logout', methods=['POST', 'GET'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Đã đăng xuất thành công.'})

@app.route('/api/products', methods=['GET'])
def get_products():
    category_id = request.args.get('category', 'all')
    search_query = request.args.get('search', '').strip()
    sort_by = request.args.get('sort', 'default')

    conn = get_db_connection()
    cursor = conn.cursor()

    query = '''
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1
    '''
    params = []

    if category_id != 'all' and category_id.isdigit():
        query += ' AND p.category_id = ?'
        params.append(int(category_id))

    if search_query:
        query += ' AND (p.name LIKE ? OR p.description LIKE ?)'
        params.extend([f'%{search_query}%', f'%{search_query}%'])

    if sort_by == 'price_asc':
        query += ' ORDER BY p.price ASC'
    elif sort_by == 'price_desc':
        query += ' ORDER BY p.price DESC'
    elif sort_by == 'name_asc':
        query += ' ORDER BY p.name ASC'
    elif sort_by == 'name_desc':
        query += ' ORDER BY p.name DESC'
    else:
        query += ' ORDER BY p.id ASC'

    cursor.execute(query, params)
    products = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify({'success': True, 'products': products, 'count': len(products)})

@app.route('/api/reserve', methods=['POST'])
def reserve():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Yêu cầu phải là thành viên để thực hiện đặt bàn! Vui lòng đăng nhập hoặc đăng ký.'}), 401

    data = request.get_json() or {}
    booking_date = data.get('booking_date', '').strip()
    time_slot = data.get('time_slot', '').strip()
    guests_count = data.get('guests_count', 1)
    seating_area = data.get('seating_area', 'Góc yên tĩnh làm việc').strip()
    note = data.get('note', '').strip()

    if not booking_date or not time_slot:
        return jsonify({'success': False, 'message': 'Vui lòng chọn ngày và khung giờ đặt bàn.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO reservations (user_id, booking_date, time_slot, guests_count, seating_area, note)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (session['user_id'], booking_date, time_slot, int(guests_count), seating_area, note))
    res_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'message': f'Đặt bàn thành công cho {guests_count} người vào lúc {time_slot} ngày {booking_date}!',
        'reservation_id': res_id
    })

@app.route('/api/my-reservations', methods=['GET'])
def my_reservations():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Chưa đăng nhập.'}), 401

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM reservations 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    ''', (session['user_id'],))
    reservations = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify({'success': True, 'reservations': reservations})

@app.route('/api/feedback', methods=['POST'])
def feedback():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    rating = data.get('rating', 5)
    message = data.get('message', '').strip()

    if not name or not email or not message:
        return jsonify({'success': False, 'message': 'Vui lòng điền đầy đủ họ tên, email và nội dung phản hồi.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO feedbacks (name, email, rating, message)
        VALUES (?, ?, ?, ?)
    ''', (name, email, int(rating), message))
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': 'Cảm ơn bạn đã gửi ý kiến đóng góp cho The Brew Lab!'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
