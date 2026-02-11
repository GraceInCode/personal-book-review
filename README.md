# 📚 Book Review App

A web application to track books you've read, store your notes, ratings, and display book covers. Inspired by [Derek Sivers' book notes](https://sive.rs/book).

## Features

- **CRUD Operations**: Create, Read, Update, and Delete book entries
- **Book Covers**: Automatically fetches book covers from Open Library API
- **Sorting**: Sort books by rating, date read, or title
- **Notes**: Store detailed notes for each book
- **Rating System**: Rate books on a 1-10 scale
- **Admin Protection**: Password-protected add/edit functionality

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Templating**: EJS
- **API**: Open Library Covers API
- **HTTP Client**: Axios
- **Styling**: Custom CSS

## Prerequisites

Before running this project, make sure you have:

- Node.js (v14 or higher)
- PostgreSQL installed and running
- npm or yarn package manager

## Database Setup

1. Create a PostgreSQL database named `Bookreview`:
```sql
CREATE DATABASE Bookreview;
```

2. Create the books table:
```sql
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  notes TEXT NOT NULL,
  date_read DATE NOT NULL,
  isbn VARCHAR(20)
);
```

## Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd BookReview
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
DB_PASSWORD=your_postgres_password
ADMIN_PASSWORD=your_admin_password
```

Replace `your_postgres_password` with your PostgreSQL password and `your_admin_password` with a password for accessing add/edit features.

## Running the Application

1. Start the server:
```bash
node index.js
```

Or use nodemon for auto-restart during development:
```bash
nodemon index.js
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

- **View Books**: The home page displays all books with covers, ratings, and dates
- **Sort Books**: Use the dropdown to sort by rating, date, or title
- **Add Book**: Click "+ Add Book" and enter the admin password
- **Edit Book**: Click on any book card to edit its details
- **Delete Book**: Click the delete button when editing a book

## API Integration

This app uses the [Open Library Covers API](https://openlibrary.org/dev/docs/api/covers) to fetch book covers:
- Searches for books by title using the Open Library Search API
- Retrieves ISBN numbers for each book
- Displays covers using the ISBN

## Project Structure

```
BookReview/
├── public/
│   └── css/
│       └── main.css          # Styles
├── views/
│   ├── partials/
│   │   ├── header.ejs        # Header partial
│   │   └── footer.ejs        # Footer partial
│   ├── index.ejs             # Home page
│   └── add.ejs               # Add/Edit form
├── .env                      # Environment variables
├── .gitignore               # Git ignore file
├── index.js                 # Main server file
├── package.json             # Dependencies
└── README.md                # This file
```

## Error Handling

- Invalid book titles that can't be found in Open Library will show an error
- Missing form fields are validated
- Database errors are logged to console
- 404 errors for non-existent book IDs

## Security Notes

- Admin password is stored in `.env` (not committed to Git)
- Database password is stored in `.env`
- SQL injection prevention using parameterized queries
- Client-side password protection for add/edit pages

## Future Enhancements

- User authentication system
- Book search functionality
- Export notes to PDF
- Reading statistics dashboard
- Book recommendations

## License

This project is open source and available for educational purposes.

## Acknowledgments

- Inspired by [Derek Sivers' book notes](https://sive.rs/book)
- Book data from [Open Library](https://openlibrary.org/)
- Built as a capstone project for web development course
