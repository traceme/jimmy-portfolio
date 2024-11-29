const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

async function splitPDF(inputPath, outputDir, numParts) {
  try {
    console.log('Reading PDF file...');
    const pdfBytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const totalPages = pdfDoc.getPageCount();
    const pagesPerPart = Math.ceil(totalPages / numParts);
    
    console.log(`Total pages: ${totalPages}`);
    console.log(`Pages per part: ${pagesPerPart}`);
    
    // Create output directory if it doesn't exist
    if (!fss.existsSync(outputDir)) {
      await fs.mkdir(outputDir, { recursive: true });
    }
    
    // Split the PDF into parts
    for (let i = 0; i < numParts; i++) {
      const start = i * pagesPerPart;
      const end = Math.min((i + 1) * pagesPerPart, totalPages);
      
      console.log(`Creating part ${i + 1} (pages ${start + 1}-${end})...`);
      
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdfDoc, Array.from(
        { length: end - start }, 
        (_, index) => start + index
      ));
      
      copiedPages.forEach(page => newPdf.addPage(page));
      
      const newPdfBytes = await newPdf.save();
      const outputPath = path.join(outputDir, `third_eye_book_part${i + 1}.pdf`);
      await fs.writeFile(outputPath, newPdfBytes);
      
      console.log(`Part ${i + 1} saved to ${outputPath}`);
    }
    
    console.log('PDF splitting completed successfully!');
  } catch (error) {
    console.error('Error splitting PDF:', error);
    throw error;
  }
}

// Run the split operation
const inputFile = path.join(__dirname, '../server/pdfs/third_eye_articles.pdf');
const outputDir = path.join(__dirname, '../public/uploads/books/third_eye_book');

console.log('Starting PDF split operation...');
console.log('Input file:', inputFile);
console.log('Output directory:', outputDir);

splitPDF(inputFile, outputDir, 5)
  .then(() => console.log('Split operation completed successfully!'))
  .catch(error => {
    console.error('Split operation failed:', error);
    process.exit(1);
  });
