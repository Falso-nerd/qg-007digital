// backend/downloads/server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb, degrees, StandardFonts } = require("pdf-lib");

const app = express();
app.use(cors());
app.use(express.json());

// Pasta com PDFs originais
const PDFS_PATH = path.join(__dirname, "pdfs");

// Endpoint: gera PDF com marca d'água centralizada (visual), diagonal e transparente em todas as páginas
app.post("/download", async (req, res) => {
  try {
    const { fileName, userEmail } = req.body;

    if (!fileName || !userEmail) {
      return res.status(400).json({ error: "Parâmetros ausentes: fileName e userEmail são obrigatórios." });
    }

    const filePath = path.join(PDFS_PATH, fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Arquivo não encontrado." });
    }

    // Carrega o PDF original
    const existingPdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Fonte para medir e desenhar o texto
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 36;
    const watermarkText = `Distribuído para: ${userEmail}`;

    // Ângulo da marca d'água
    const angleDeg = 45;

    const pages = pdfDoc.getPages();
    pages.forEach((page) => {
      const { width, height } = page.getSize();

      page.drawText(watermarkText, {
        x: width / 2 - 150, // ajuste horizontal
        y: height / 2,      // ajuste vertical
        size: fontSize,
        font,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.25,
        rotate: degrees(angleDeg),
      });
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName.replace(/\.pdf$/i, "")}-marcado.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao gerar o PDF com marca d'água." });
  }
});

const PORT = 3100;
app.listen(PORT, () => {
  console.log(`Servidor de downloads rodando em http://localhost:${PORT}`);
});
