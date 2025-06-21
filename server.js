require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const bodyParser = require('body-parser');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const port = 3000;

// OpenRouter setup (acts like OpenAI)
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
// Ensure 'generated' folder exists
const generatedDir = path.join(__dirname, 'generated');
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir);
}

// AI summary using OpenRouter
async function getSummary(name) {
  console.log("🔁 Generating summary for:", name);

  const prompt = `Write a two-page biography summary of ${name} in school-level English. Divide clearly into:
Page 1:
...
Page 2:
...`;

  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    const [_, page1, page2] = content.split(/Page\s*1:|Page\s*2:/i);
    return {
      page1: page1?.trim() || "Page 1 summary not available.",
      page2: page2?.trim() || "Page 2 summary not available.",
    };
  } catch (err) {
    console.error("❌ OpenRouter error:", err);
    throw err;
  }
}


app.post('/generate-summary', async (req, res) => {
  const name = req.body.name;

  try {
    const summary = await getSummary(name); // same AI function
    res.json(summary); // return text instead of PDF
  } catch (error) {
    console.error("Summary API error:", error.message);
    res.status(500).send("Failed to get summary.");
  }
});

// Route to generate PDF
app.post('/generate', async (req, res) => {
  const name = req.body.name;
  const filename = `${name.replace(/\s+/g, '_')}_summary.pdf`;
  const filepath = path.join(generatedDir, filename);

  try {
    const summary = await getSummary(name);

    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    doc.fontSize(16).text(`Page 1:\n\n${summary.page1}`, { align: 'left' });
    doc.addPage();
    doc.fontSize(16).text(`Page 2:\n\n${summary.page2}`, { align: 'left' });
    doc.end();

    stream.on('finish', () => {
      res.download(filepath, filename);
    });

    stream.on('error', (err) => {
      console.error("PDF generation error:", err);
      res.status(500).send("Failed to generate PDF.");
    });

  } catch (error) {
    console.error("❌ AI Summary Error:", error.message);
    res.status(500).send("Failed to get AI summary.");
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at: http://localhost:${port}`);
});
