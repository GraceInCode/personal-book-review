// Import required dependencies
import express from 'express';
import pg from 'pg';  // PostgreSQL client for database operations
import bodyParser from 'body-parser';  // Parse incoming request bodies
import axios from 'axios';  // HTTP client for API requests
import 'dotenv/config';  // Load environment variables from .env file

// Configure PostgreSQL database connection
const db = new pg.Client({
    database: 'Bookreview',
    user: 'postgres',
    password: process.env.DB_PASSWORD,  // Password stored in .env for security
    port: 5432,
    host: 'localhost'
})
db.connect();

// Initialize Express application
const app = express();
const PORT = 3000;

// Middleware setup
app.use(bodyParser.json());  // Parse JSON request bodies
app.use(bodyParser.urlencoded({ extended: true }));  // Parse URL-encoded form data
app.set('view engine', 'ejs');  // Set EJS as the templating engine
app.use(express.static("public"));  // Serve static files from public directory

// In-memory cache for books (populated from database)
let books = [];

/**
 * Fetch all books from the database
 * @returns {Array} Array of book objects from database
 */
async function getBooks() {
    const response = await db.query('SELECT * FROM books;')
    books = response.rows;
    return books;
}

/**
 * Fetch ISBN for a book using Open Library API
 * @param {string} title - The book title to search for
 * @returns {string|null} ISBN number or null if not found
 */
async function getBookISBN(title) {
    try {
        // Encode title for URL and make API request to Open Library
        const query = encodeURIComponent(title);
        const response = await axios.get(`https://openlibrary.org/search.json?title=${query}`);
        const bookData = response.data.docs[0];

        if (!bookData) return null;

        // 1. Check the standard ISBN array
        if (bookData.isbn && bookData.isbn.length > 0) {
            // Prefer ISBN-13 format for better compatibility with cover API
            const isbn13 = bookData.isbn.find(number => number.length === 13);
            return isbn13 || bookData.isbn[0];
        }

        // 2. Fallback to lending identifier if standard ISBN not available
        if (bookData.lending_identifier_s && bookData.lending_identifier_s.includes('isbn_')) {
            return bookData.lending_identifier_s.split('_')[1];
        }

        return null;
    } catch (error) {
        console.error("Fetch error:", error);
        return null;
    }
}

// GET route - Display all books with sorting options
app.get('/', async (req, res) => {
    try {
        // Fetch all books from database
        const books = await getBooks();
        
        // Get sort parameter from query string (default: date)
        const currentSort = req.query.sort || 'date';
        
        // Sort books based on user selection
        if (currentSort === 'rating') {
            // Sort by rating (highest first)
            books.sort((a, b) => b.rating - a.rating);
        } else if (currentSort === 'title') {
            // Sort alphabetically by title
            books.sort((a, b) => a.title.localeCompare(b.title));
        } else {
            // Default: sort by date read (newest first)
            books.sort((a, b) => new Date(b.date_read) - new Date(a.date_read));
        }
        
        // Render index page with sorted books
        res.render('index.ejs', { books: books, currentSort: currentSort })
    } catch (error) {
        console.error(error);
    }
})

// GET route - Display form to add a new book
app.get('/add', async (req, res) => {
    try {
        // Render add/edit form with empty book data
        res.render('add.ejs', {
            title: 'Add New book',
            action: '/add',
            submitText: 'Create',
            book: null,  // No existing book data
            adminPassword: process.env.ADMIN_PASSWORD  // For client-side password protection
        })
    } catch (error) {
        console.error(error);
    }
})

// POST route - Create a new book entry
app.post('/add', async (req, res) => {
    try {
        // Extract form data from request body
        const { title, author, rating, notes, date_read } = req.body;
        console.log(req.body);
        
        // Validate that all required fields are present
        if (!title || !author || !rating || !notes || !date_read) {
            return res.status(400).send('All fields are required');
        }
        
        // Fetch ISBN from Open Library API using book title
        const isbn = await getBookISBN(title);
        if (!isbn) {
            console.warn(`No ISBN found for book: ${title}. Make sure the title of the book is written correctly`);
            return res.status(400).send('Could not fetch ISBN for the provided book title. Please make sure the title is correct.');
        }
        
        // Insert new book into database with parameterized query (prevents SQL injection)
        await db.query(
            'INSERT INTO books (title, author, rating, notes, date_read, isbn) VALUES ($1, $2, $3, $4, $5, $6)',
            [title, author, rating, notes, date_read, isbn]
        );
        
        // Redirect to home page after successful creation
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding book');
    }
})

// GET route - Display form to edit an existing book
app.get('/book/:id', async (req, res) => {
    try {
        // Get book ID from URL parameter
        const id = req.params.id;
        
        // Fetch specific book from database using parameterized query
        const response = await db.query('SELECT * FROM books WHERE id = $1;', [id])
        const book = response.rows[0];
        
        if (book) {
            // Render same form as add, but pre-populated with existing book data
            res.render('add.ejs', {
                title: 'Edit book',
                action: '/book/' + id,
                submitText: 'Edit',
                book: book,  // Pass existing book data to form
                deleteAction: '/book/' + id + '/delete',  // Enable delete button
                adminPassword: process.env.ADMIN_PASSWORD
            })
        } else {
            res.status(404).send('Book not found');
        }
    } catch (error) {
        console.error(error);
}})

// POST route - Update an existing book (handled by same route as GET /book/:id)
app.post('/book/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { title, author, rating, notes, date_read } = req.body;
        
        // Update book in database with new values
        await db.query(
            'UPDATE books SET title = $1, author = $2, rating = $3, notes = $4, date_read = $5 WHERE id = $6',
            [title, author, rating, notes, date_read, id]
        );
        
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating book');
    }
});

// POST route - Delete a book entry
app.post('/book/:id/delete', async (req, res) => {
    try {
        // Get book ID from URL parameter
        const id = req.params.id;
        
        // Delete book from database using parameterized query
        await db.query('DELETE FROM books WHERE id = $1;', [id]);
        
        // Redirect to home page after deletion
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting book');
    }
})

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});