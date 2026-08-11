from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from flask import Flask, flash, g, jsonify, redirect, render_template, request, url_for


BASE_DIR = Path(__file__).resolve().parent
DATABASE = BASE_DIR / "bookshop.db"
SEED_FILE = BASE_DIR / "data" / "books.json"

app = Flask(__name__)
app.config["DATABASE"] = DATABASE
app.secret_key = "book-corner-development-key"


def get_db() -> sqlite3.Connection:
    if "db" not in g:
        g.db = sqlite3.connect(app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(_error=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db() -> None:
    db = sqlite3.connect(app.config["DATABASE"])
    db.execute("PRAGMA foreign_keys = ON")
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS category (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        );
        CREATE TABLE IF NOT EXISTS book (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            publish_year INTEGER,
            price INTEGER NOT NULL,
            image TEXT,
            in_stock INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (category_id) REFERENCES category(id) ON UPDATE CASCADE ON DELETE RESTRICT
        );
        CREATE TABLE IF NOT EXISTS customer (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullname TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT,
            address TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS "order" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            total_amount INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'pending',
            FOREIGN KEY (customer_id) REFERENCES customer(id) ON UPDATE CASCADE ON DELETE RESTRICT
        );
        CREATE TABLE IF NOT EXISTS order_item (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            book_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price INTEGER NOT NULL,
            FOREIGN KEY (order_id) REFERENCES "order"(id) ON UPDATE CASCADE ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES book(id) ON UPDATE CASCADE ON DELETE RESTRICT
        );
        """
    )
    if db.execute("SELECT COUNT(*) FROM category").fetchone()[0] == 0:
        seed = json.loads(SEED_FILE.read_text(encoding="utf-8-sig"))
        db.executemany("INSERT INTO category (id, name) VALUES (?, ?)", [(c["id"], c["name"]) for c in seed["categories"]])
        db.executemany(
            """INSERT INTO book (id, category_id, title, author, publish_year, price, image, in_stock)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            [(b["id"], b["categoryId"], b["title"], b["author"], b["year"], b["price"], b["image"], int(b["inStock"])) for b in seed["books"]],
        )
    db.commit()
    db.close()


def books_with_categories():
    return get_db().execute(
        """SELECT book.*, category.name AS category_name
           FROM book JOIN category ON category.id = book.category_id
           ORDER BY book.publish_year DESC, book.id DESC"""
    ).fetchall()


@app.template_filter("money")
def money(value):
    return f"{int(value):,}".replace(",", ".") + " đ" if value else "Liên hệ"


@app.route("/")
@app.route("/index.html")
def home():
    return render_template("index.html")


@app.route("/products")
@app.route("/products.html")
def products():
    return render_template("products.html")


@app.route("/contact")
@app.route("/contact.html")
def contact():
    return render_template("contact.html")


@app.get("/api/books")
def api_books():
    rows = books_with_categories()
    return jsonify({"categories": [dict(row) for row in get_db().execute("SELECT * FROM category ORDER BY id")], "books": [dict(row) for row in rows]})


@app.get("/admin/books")
def admin_books():
    return render_template("admin_books.html", books=books_with_categories(), categories=get_db().execute("SELECT * FROM category ORDER BY name").fetchall())


@app.route("/admin/books/new", methods=("GET", "POST"))
def admin_book_new():
    categories = get_db().execute("SELECT * FROM category ORDER BY name").fetchall()
    if request.method == "POST":
        form = request.form
        if not form.get("title") or not form.get("author") or not form.get("category_id"):
            flash("Vui lòng nhập đầy đủ tên sách, tác giả và danh mục.", "error")
        else:
            get_db().execute("""INSERT INTO book (category_id, title, author, publish_year, price, image, in_stock)
                VALUES (?, ?, ?, ?, ?, ?, ?)""", (form["category_id"], form["title"].strip(), form["author"].strip(), form.get("publish_year") or None, form.get("price") or 0, form.get("image", "").strip(), int("in_stock" in form)))
            get_db().commit()
            flash("Đã thêm sách mới.", "success")
            return redirect(url_for("admin_books"))
    return render_template("admin_book_form.html", book=None, categories=categories, page_title="Thêm sách")


@app.route("/admin/books/<int:book_id>/edit", methods=("GET", "POST"))
def admin_book_edit(book_id):
    db = get_db()
    book = db.execute("SELECT * FROM book WHERE id = ?", (book_id,)).fetchone()
    if book is None:
        return "Không tìm thấy sách", 404
    if request.method == "POST":
        form = request.form
        db.execute("""UPDATE book SET category_id=?, title=?, author=?, publish_year=?, price=?, image=?, in_stock=? WHERE id=?""", (form["category_id"], form["title"].strip(), form["author"].strip(), form.get("publish_year") or None, form.get("price") or 0, form.get("image", "").strip(), int("in_stock" in form), book_id))
        db.commit()
        flash("Đã cập nhật thông tin sách.", "success")
        return redirect(url_for("admin_books"))
    return render_template("admin_book_form.html", book=book, categories=db.execute("SELECT * FROM category ORDER BY name").fetchall(), page_title="Sửa sách")


@app.post("/admin/books/<int:book_id>/delete")
def admin_book_delete(book_id):
    db = get_db()
    try:
        db.execute("DELETE FROM book WHERE id = ?", (book_id,))
        db.commit()
        flash("Đã xóa sách.", "success")
    except sqlite3.IntegrityError:
        flash("Không thể xóa sách đã xuất hiện trong đơn hàng.", "error")
    return redirect(url_for("admin_books"))


with app.app_context():
    init_db()


if __name__ == "__main__":
    app.run(debug=True)
