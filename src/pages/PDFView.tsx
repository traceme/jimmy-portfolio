import React, { useState, useEffect } from 'react';
import PDFViewer from '../components/PDFViewer';
import { Box, Alert, Button, CircularProgress, Typography } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

interface Book {
  id: string;
  title: string;
  filename: string;
  filePath: string;
  uploadDate: string;
  size: number;
}

const PDFView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState<Book | undefined>(undefined);

  useEffect(() => {
    const loadBook = async () => {
      try {
        // First try to get book from location state
        const stateBook = location.state?.book as Book | undefined;
        if (stateBook && stateBook.id === bookId) {
          setBook(stateBook);
          setLoading(false);
          return;
        }

        // If no state or different book, fetch from server
        const response = await fetch('http://localhost:3001/api/books');
        if (!response.ok) {
          throw new Error('Failed to fetch books');
        }

        const books = await response.json();
        const foundBook = books.find((b: Book) => b.id === bookId);

        if (!foundBook) {
          throw new Error('Book not found');
        }

        setBook(foundBook);
      } catch (err) {
        console.error('Error loading book:', err);
        setError(err instanceof Error ? err.message : 'Failed to load book');
      } finally {
        setLoading(false);
      }
    };

    if (bookId) {
      loadBook();
    } else {
      setError('No book ID provided');
      setLoading(false);
    }
  }, [bookId, location.state]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading book...</Typography>
      </Box>
    );
  }

  if (error || !book) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error || 'No book selected. Please choose a book from the library.'}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/library')}
          sx={{ mt: 2 }}
        >
          Back to Library
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      {book && book.filePath && (
        <PDFViewer 
          pdfPath={book.filePath}
          title={book.title || book.filename}
        />
      )}
    </Box>
  );
};

export default PDFView;
