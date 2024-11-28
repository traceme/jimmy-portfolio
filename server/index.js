const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Serve PDF files from the pdfs directory
app.use('/pdf', express.static(path.join(__dirname, 'pdfs')));

// Basic route for testing
app.get('/', (req, res) => {
  res.send('PDF Server is running');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
