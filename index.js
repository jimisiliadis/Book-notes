import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Booknotes",
  password: "Admin123!?",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  const sort = req.query.sort || "date_read";
  let orderBy = "ORDER BY date_read DESC";

  if (sort === "title") {
    orderBy = "ORDER BY title ASC";
  } else if (sort === "rating") {
    orderBy = "ORDER BY rating DESC";
  }

  try {
    const result = await db.query(`SELECT * FROM books ${orderBy}`);
    res.render("index.ejs", {
      listTitle: "My Book Notes",
      books: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving books.");
  }
});

// Show form to add new book
app.get("/add", (req, res) => {
  res.render("add.ejs");
});

// Add new book to the database
app.post("/add", async (req, res) => {
  const { title, author, rating, date_read, notes, cover_id } = req.body;

  try {
    await db.query(
      "INSERT INTO books (title, author, rating, date_read, notes, cover_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [title, author, rating, date_read, notes, cover_id]
    );
    res.redirect("/");
  } catch (err) {
    console.error("Error inserting book:", err);
    res.status(500).send("Failed to add book.");
  }
});

app.get("/edit/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query("SELECT * FROM books WHERE id = $1", [id]);
    const book = result.rows[0];  // ✅ define book
    res.render("edit.ejs", { book: book });
    console.log(book); // ✅ safe to log now
  } catch (error) {
    console.log(error);
    res.status(500).send("Error loading book!");
  }
});

app.post("/edit/:id", async (req, res) => {
  const id = req.params.id;
  const { title, author, rating, date_read, notes, cover_id } = req.body;

  try {
    await db.query(
      "UPDATE books SET title=$1, author=$2, rating=$3, date_read=$4, notes=$5, cover_id=$6 WHERE id=$7",
      [title, author, rating, date_read, notes, cover_id, id]
    );
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating book.");
  }
});

app.post("/delete/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await db.query("DELETE FROM books WHERE id = $1", [id]);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting book.");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
