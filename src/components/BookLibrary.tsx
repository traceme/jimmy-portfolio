import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  IconButton,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Snackbar
} from '@mui/material';
import UploadBook from './UploadBook';
import { useNavigate } from 'react-router-dom';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface Book {
  id: string;
  title: string;
  filename: string;
  filePath: string;
  uploadDate: string;
  size: number;
}

const BookLibrary: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const navigate = useNavigate();

  const fetchBooks = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:3001/api/books');
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }
      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error('Error fetching books:', error);
      setError('Failed to load books. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleBookClick = (book: Book) => {
    // Ensure the book has all required fields
    if (!book.filePath || !book.id || !book.filename) {
      console.error('Invalid book data:', book);
      setSnackbar({
        open: true,
        message: 'Invalid book data',
        severity: 'error'
      });
      return;
    }

    console.log('Navigating to book:', book);

    // Navigate to PDF view with book ID in URL and data in state
    navigate(`/pdf-view/${encodeURIComponent(book.id)}`, { 
      state: { book: {
        id: book.id,
        title: book.title || book.filename,
        filename: book.filename,
        filePath: book.filePath,
        uploadDate: book.uploadDate,
        size: book.size
      }}
    });
  };

  const handleDeleteClick = (event: React.MouseEvent, book: Book) => {
    event.stopPropagation();
    setSelectedBook(book);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBook) return;

    try {
      const response = await fetch(`http://localhost:3001/api/books/${selectedBook.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete book');
      }

      setSnackbar({
        open: true,
        message: 'Book deleted successfully',
        severity: 'success'
      });
      
      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete book',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedBook(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        PDF Library
      </Typography>
      
      <UploadBook onUploadSuccess={fetchBooks} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : books.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No PDFs uploaded yet. Use the upload button above to add some PDFs.
        </Alert>
      ) : (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {books.map((book) => (
            <Grid item xs={12} sm={6} md={4} key={book.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    cursor: 'pointer'
                  }
                }}
                onClick={() => handleBookClick(book)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <PictureAsPdfIcon color="error" sx={{ mr: 1 }} />
                    <Typography 
                      variant="h6" 
                      component="h2" 
                      noWrap 
                      sx={{ 
                        flexGrow: 1,
                        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif', 
                        fontSize: '1rem',
                        lineHeight: 1.4
                      }}
                      title={book.filename}
                    >
                      {book.filename}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleDeleteClick(e, book)}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookClick(book);
                      }}
                      sx={{ ml: 1 }}
                    >
                      <OpenInNewIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Size: {formatFileSize(book.size)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uploaded: {formatDate(book.uploadDate)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete PDF</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedBook?.filename}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BookLibrary;
