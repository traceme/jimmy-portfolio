const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fss = require('fs');
const OpenAI = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS with proper configuration
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges'],
  credentials: true
}));

// Enable JSON parsing
app.use(express.json({ limit: '800mb' }));
app.use(express.urlencoded({ limit: '800mb', extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads/books');
    if (!fss.existsSync(uploadDir)) {
      fss.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Preserve original filename with proper UTF-8 encoding
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, originalName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Ensure filename is properly decoded
    const decodedFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
    if (decodedFilename.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 800 * 1024 * 1024 // 800MB
  }
});

// Serve static files from public directory
app.use('/uploads', (req, res, next) => {
  // Add CORS headers for PDF files
  if (req.path.endsWith('.pdf')) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Range');
    res.header('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges');
  }
  next();
}, express.static(path.join(__dirname, '../public/uploads')));

// Create required directories
const createRequiredDirectories = async () => {
  const dirs = [
    path.join(__dirname, '../public'),
    path.join(__dirname, '../public/uploads'),
    path.join(__dirname, '../public/uploads/books'),
    path.join(__dirname, '../public/pdf-pages')
  ];

  for (const dir of dirs) {
    try {
      if (!fss.existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error);
    }
  }
};

// Function to copy PDFs from public directory
const copyPublicPDFs = async () => {
  const publicPDFDir = path.join(__dirname, '..', 'public', 'pdf-pages');
  const serverPDFDir = path.join(__dirname, 'pdfs');

  // Create server PDF directory if it doesn't exist
  if (!(await fs.readdir(__dirname)).includes('pdfs')) {
    await fs.mkdir(serverPDFDir, { recursive: true });
  }

  // Check if public PDF directory exists
  if ((await fs.readdir(path.join(__dirname, '..'))).includes('public')) {
    if ((await fs.readdir(publicPDFDir)).length > 0) {
      // Read all files from public PDF directory
      const files = await fs.readdir(publicPDFDir);
      
      // Copy each PDF file that doesn't already exist in server directory
      for (const file of files) {
        if (file.toLowerCase().endsWith('.pdf')) {
          const sourcePath = path.join(publicPDFDir, file);
          const targetPath = path.join(serverPDFDir, file);
          
          // Only copy if file doesn't exist in target directory
          if (!(await fs.readdir(serverPDFDir)).includes(file)) {
            await fs.copyFile(sourcePath, targetPath);
            console.log(`Copied ${file} to server PDF directory`);
          }
        }
      }
    }
  }
};

// Copy public PDFs when server starts
copyPublicPDFs();

// Serve static files from the PDF directory
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

// Serve PDF pages from public directory
app.use('/pdf-pages', express.static(path.join(__dirname, '..', 'public', 'pdf-pages')));

// Get all pages of a book
app.get('/api/book-pages', async (req, res) => {
  try {
    const bookDir = path.join(__dirname, '../public/uploads/books');
    const files = await fs.readdir(bookDir);
    
    // Filter for PDF files and sort them numerically
    const pdfFiles = files
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .sort((a, b) => {
        // Extract numbers from filenames for proper sorting
        const numA = parseInt(a.match(/\d+/) || ['0'][0]);
        const numB = parseInt(b.match(/\d+/) || ['0'][0]);
        return numA - numB;
      });

    if (pdfFiles.length === 0) {
      return res.status(404).json({ error: 'No PDF files found' });
    }

    // Generate full URLs for each PDF file
    const pages = pdfFiles.map(file => {
      const encodedFilename = encodeURIComponent(file);
      return `http://localhost:3001/uploads/books/${encodedFilename}`;
    });

    res.json({ pages });
  } catch (error) {
    console.error('Error serving book pages:', error);
    res.status(500).json({ error: 'Failed to serve book pages' });
  }
});

// Get list of books
app.get('/api/books', async (req, res) => {
  try {
    const booksDir = path.join(__dirname, '../public/uploads/books');
    console.log('Fetching books from:', booksDir);
    
    if (!fss.existsSync(booksDir)) {
      await fs.mkdir(booksDir, { recursive: true });
      console.log('Created books directory');
    }

    // Read directory with proper encoding
    const files = await fs.readdir(booksDir, { encoding: 'utf8' });
    console.log('Found files:', files);

    const books = await Promise.all(
      files
        .filter(filename => filename.toLowerCase().endsWith('.pdf'))
        .map(async (filename) => {
          const filePath = path.join(booksDir, filename);
          const stats = await fs.stat(filePath);
          
          // Use Buffer for proper UTF-8 handling
          const decodedFilename = Buffer.from(filename, 'utf8').toString();
          const safeFilename = encodeURIComponent(decodedFilename);
          const fileUrl = `/uploads/books/${safeFilename}`;
          
          const book = {
            id: Buffer.from(filename).toString('base64'),
            title: path.parse(decodedFilename).name,
            filename: decodedFilename,
            filePath: fileUrl,
            uploadDate: stats.mtime,
            size: stats.size
          };
          
          console.log('Book entry:', {
            ...book,
            fullPath: filePath,
            exists: fss.existsSync(filePath)
          });
          
          return book;
        })
    );

    res.json(books);
  } catch (error) {
    console.error('Error getting books:', error);
    res.status(500).json({ error: 'Failed to get books', details: error.message });
  }
});

// Get book by ID
app.get('/api/books/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    const filename = Buffer.from(bookId, 'base64').toString();
    const filePath = path.join(__dirname, '../public/uploads/books', filename);
    
    if (!fss.existsSync(filePath)) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const stats = await fs.stat(filePath);
    const book = {
      id: bookId,
      title: path.parse(filename).name,
      filename: filename,
      filePath: `/uploads/books/${encodeURIComponent(filename)}`,
      uploadDate: stats.mtime,
      size: stats.size
    };

    res.json(book);
  } catch (error) {
    console.error('Error getting book:', error);
    res.status(500).json({ error: 'Failed to get book' });
  }
});

// Upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File uploaded:', req.file);
    const stats = await fs.stat(req.file.path);
    const book = {
      id: Buffer.from(req.file.filename).toString('base64'),
      title: path.parse(req.file.filename).name,
      filename: req.file.filename,
      filePath: `/uploads/books/${encodeURIComponent(req.file.filename)}`,
      uploadDate: stats.mtime,
      size: stats.size
    };

    console.log('Created book entry:', book);
    res.json(book);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Delete book endpoint
app.delete('/api/books/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    const filename = Buffer.from(bookId, 'base64').toString();
    const filePath = path.join(__dirname, '../public/uploads/books', filename);
    
    console.log('Attempting to delete:', filePath);
    
    if (!fss.existsSync(filePath)) {
      console.log('File not found:', filePath);
      return res.status(404).json({ error: 'Book not found' });
    }

    await fs.unlink(filePath);
    console.log('Successfully deleted:', filePath);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

// Serve PDF files
app.get('/uploads/books/:filename', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const filePath = path.join(__dirname, '../public/uploads/books', filename);
    
    console.log('Serving PDF file:', {
      requestedFile: filename,
      fullPath: filePath
    });

    if (!fss.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).json({ error: 'PDF not found' });
    }

    const stat = await fs.stat(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'application/pdf',
      });

      const stream = fss.createReadStream(filePath, { start, end });
      stream.on('error', (error) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream PDF' });
        }
      });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'application/pdf',
        'Accept-Ranges': 'bytes'
      });

      const stream = fss.createReadStream(filePath);
      stream.on('error', (error) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream PDF' });
        }
      });
      stream.pipe(res);
    }
  } catch (error) {
    console.error('Error serving PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to serve PDF', details: error.message });
    }
  }
});

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, model } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!model) {
      return res.status(400).json({ error: 'Model selection is required' });
    }

    let reply;

    switch (model) {
      case 'gpt4':
        const chatCompletion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant on Jimmy's portfolio website. You can discuss Jimmy's skills, experience, and projects professionally and enthusiastically."
            },
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        });
        reply = chatCompletion.choices[0].message.content;
        break;

      case 'gpt3.5':
        const gpt35Completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant on Jimmy's portfolio website. You can discuss Jimmy's skills, experience, and projects professionally and enthusiastically."
            },
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        });
        reply = gpt35Completion.choices[0].message.content;
        break;

      case 'claude':
        const claudeResponse = await anthropic.messages.create({
          model: "claude-3-sonnet-20240229",
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content: message
            }
          ],
          system: "You are a helpful assistant on Jimmy's portfolio website. You can discuss Jimmy's skills, experience, and projects professionally and enthusiastically."
        });
        reply = claudeResponse.content[0].text;
        break;

      default:
        return res.status(400).json({ error: 'Invalid model selection' });
    }

    res.json({ reply });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to get response from AI service',
      details: error.message 
    });
  }
});

// Initialize required directories and start server
const startServer = async () => {
  try {
    await createRequiredDirectories();
    
    // Log the current state of directories
    const publicDir = path.join(__dirname, '../public');
    const uploadsDir = path.join(__dirname, '../public/uploads');
    const booksDir = path.join(__dirname, '../public/uploads/books');
    
    console.log('Directory structure:');
    console.log('Public dir exists:', fss.existsSync(publicDir));
    console.log('Uploads dir exists:', fss.existsSync(uploadsDir));
    console.log('Books dir exists:', fss.existsSync(booksDir));
    
    if (fss.existsSync(booksDir)) {
      const files = await fs.readdir(booksDir);
      console.log('Books directory contents:', files);
    }

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      console.log(`Upload directory: ${path.join(__dirname, '../public/uploads/books')}`);
      console.log('Max file size: 800MB');
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();
