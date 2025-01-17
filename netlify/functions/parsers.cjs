const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function parsePdf(buffer) {
  const data = await pdfParse(buffer);
  return data.text;
}

async function parseDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

module.exports = {
  parsePdf,
  parseDocx
};
