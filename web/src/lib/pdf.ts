import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 36;
const TITLE_SIZE = 16;
const META_SIZE = 9;
const TABLE_SIZE = 7.5;
const HEADER_ROW_HEIGHT = 16;
const LINE_HEIGHT = 9.5;
const CELL_PADDING = 3;
const MAX_CELL_LINES = 5;

const PINE = rgb(0.047, 0.204, 0.173);
const MOSS = rgb(0.42, 0.46, 0.41);
const SAND = rgb(0.953, 0.941, 0.89);
const RULE = rgb(0.86, 0.88, 0.85);

export type ReportPdfData = {
  title: string;
  subtitle?: string | null;
  headers: string[];
  rows: (string | number | null | undefined)[][];
};

const WINANSI_UNDEFINED = new Set([0x81, 0x8d, 0x8f, 0x90, 0x9d]);

function sanitize(value: unknown): string {
  const text = value == null ? "" : String(value);
  return text
    .replace(/\u00b7/g, "-")
    .replace(/[\u2014\u2013]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u00b1/g, "+/-")
    .replace(/\u2026/g, "...")
    .replace(/\u2265/g, ">=")
    .replace(/\u2264/g, "<=")
    .replace(/[^\x20-\xff]/g, "?")
    .split("")
    .filter((ch) => !WINANSI_UNDEFINED.has(ch.charCodeAt(0)))
    .join("");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (text === "") return [""];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  const pushLongWord = (word: string) => {
    let remaining = word;
    while (remaining.length > 0 && font.widthOfTextAtSize(remaining, size) > maxWidth) {
      let cut = remaining.length;
      while (cut > 1 && font.widthOfTextAtSize(remaining.slice(0, cut), size) > maxWidth) {
        cut -= 1;
      }
      lines.push(remaining.slice(0, cut));
      remaining = remaining.slice(cut);
    }
    return remaining;
  };

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) {
      lines.push(line);
      line = "";
    }
    line = pushLongWord(word);
  }
  if (line) lines.push(line);
  return lines.length > 0 ? lines : [""];
}

function clampLines(lines: string[]): { lines: string[]; truncated: boolean } {
  if (lines.length <= MAX_CELL_LINES) return { lines, truncated: false };
  const kept = lines.slice(0, MAX_CELL_LINES);
  const last = kept[MAX_CELL_LINES - 1];
  kept[MAX_CELL_LINES - 1] = last.length > 3 ? `${last.slice(0, -3)}...` : `${last}...`;
  return { lines: kept, truncated: true };
}

export async function buildReportPdf(data: ReportPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(sanitize(data.title));
  doc.setAuthor("Plantiful");
  doc.setProducer("Plantiful reporting");
  doc.setCreationDate(new Date());

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const headers = data.headers.map(sanitize);
  const tableWidth = PAGE_WIDTH - MARGIN * 2;
  const columnWidth = tableWidth / Math.max(headers.length, 1);
  const cellWidth = columnWidth - CELL_PADDING * 2;
  const bottom = MARGIN;

  let page: PDFPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const drawTitleBlock = () => {
    page.drawText(sanitize(data.title), {
      x: MARGIN,
      y: y - TITLE_SIZE,
      size: TITLE_SIZE,
      font: bold,
      color: PINE,
    });
    y -= TITLE_SIZE + 7;

    if (data.subtitle) {
      page.drawText(sanitize(data.subtitle), {
        x: MARGIN,
        y: y - META_SIZE,
        size: META_SIZE,
        font,
        color: MOSS,
      });
      y -= META_SIZE + 6;
    }

    const meta = `Generated ${new Date().toLocaleString()} \u00b7 ${data.rows.length} row(s)`;
    page.drawText(sanitize(meta), {
      x: MARGIN,
      y: y - META_SIZE,
      size: META_SIZE - 0.5,
      font,
      color: MOSS,
    });
    y -= META_SIZE + 12;
  };

  const drawTableHeader = () => {
    page.drawRectangle({
      x: MARGIN,
      y: y - HEADER_ROW_HEIGHT,
      width: tableWidth,
      height: HEADER_ROW_HEIGHT,
      color: SAND,
    });
    headers.forEach((header, index) => {
      const fitted = wrapText(header, bold, TABLE_SIZE, cellWidth)[0] ?? "";
      page.drawText(fitted, {
        x: MARGIN + index * columnWidth + CELL_PADDING,
        y: y - HEADER_ROW_HEIGHT + 5,
        size: TABLE_SIZE,
        font: bold,
        color: PINE,
      });
    });
    y -= HEADER_ROW_HEIGHT;
  };

  const startPage = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    drawTableHeader();
  };

  drawTitleBlock();
  drawTableHeader();

  for (const row of data.rows) {
    const cells = headers.map((_, index) => {
      const raw = sanitize(row[index]);
      const wrapped = wrapText(raw, font, TABLE_SIZE, cellWidth);
      return clampLines(wrapped).lines;
    });
    const maxLines = Math.max(1, ...cells.map((lines) => lines.length));
    const rowHeight = Math.max(HEADER_ROW_HEIGHT, maxLines * LINE_HEIGHT + CELL_PADDING * 2);

    if (y - rowHeight < bottom) {
      startPage();
    }

    cells.forEach((lines, index) => {
      const x = MARGIN + index * columnWidth + CELL_PADDING;
      lines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x,
          y: y - CELL_PADDING - LINE_HEIGHT * (lineIndex + 1) + 2,
          size: TABLE_SIZE,
          font,
          color: PINE,
        });
      });
    });

    y -= rowHeight;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: RULE,
    });
  }

  const pages = doc.getPages();
  pages.forEach((p, index) => {
    p.drawText(sanitize(`Page ${index + 1} of ${pages.length}`), {
      x: PAGE_WIDTH - MARGIN - 60,
      y: MARGIN / 2,
      size: 7.5,
      font,
      color: MOSS,
    });
    p.drawText(sanitize("Plantiful \u00b7 Niah National Park"), {
      x: MARGIN,
      y: MARGIN / 2,
      size: 7.5,
      font,
      color: MOSS,
    });
  });

  return doc.save();
}
