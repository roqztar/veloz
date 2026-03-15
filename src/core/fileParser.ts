/**
 * Secure File Parser for Veloz Speed Reader
 * Handles PDF, DOC, DOCX, PPT, PPTX, and TXT file parsing
 * All parsing happens client-side for privacy/security
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker (client-side only)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types and extensions
const ALLOWED_TYPES: Record<string, string[]> = {
  'text/plain': ['txt'],
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.ms-powerpoint': ['ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
};

// Fallback extensions for files without proper MIME types
const ALLOWED_EXTENSIONS = ['txt', 'pdf', 'doc', 'docx', 'ppt', 'pptx'];

export interface ParsedFile {
  text: string;
  fileName: string;
  wordCount: number;
  error?: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file type and size for security
 */
export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Datei zu groß. Maximale Größe: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check file size is not 0
  if (file.size === 0) {
    return {
      valid: false,
      error: 'Datei ist leer.',
    };
  }

  // Get file extension
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  // Validate MIME type or extension
  const mimeTypeAllowed = Object.keys(ALLOWED_TYPES).includes(file.type);
  const extensionAllowed = ALLOWED_EXTENSIONS.includes(extension);

  if (!mimeTypeAllowed && !extensionAllowed) {
    return {
      valid: false,
      error: `Ungültiger Dateityp. Erlaubt: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  // Double-check: if MIME type doesn't match extension, verify extension
  if (file.type && !mimeTypeAllowed) {
    // File has a MIME type but it's not in our allowlist
    // Allow if extension is valid (some systems send generic MIME types)
    if (!extensionAllowed) {
      return {
        valid: false,
        error: `Dateityp nicht erkannt. Erlaubt: ${ALLOWED_EXTENSIONS.join(', ')}`,
      };
    }
  }

  // Security: Check for path traversal in filename
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      valid: false,
      error: 'Ungültiger Dateiname.',
    };
  }

  return { valid: true };
}

/**
 * Sanitizes extracted text to prevent XSS while preserving Unicode
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove null bytes (security)
  let sanitized = text.replace(/\x00/g, '');

  // Remove dangerous control characters but KEEP Unicode
  // Only remove C0 control characters except: tab(9), LF(10), CR(13)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  
  // Remove C1 control characters (U+0080-U+009F) but keep all other Unicode
  sanitized = sanitized.replace(/[\u0080-\u009F]/g, '');
  
  // Note: We do NOT remove high Unicode planes - they contain Umlaute, CJK, etc.
  // Umlaute: ä = \u00E4, ö = \u00F6, ü = \u00FC (all in Latin-1 Supplement, safe)

  // Limit length to prevent DoS (max 500KB of text)
  const MAX_TEXT_LENGTH = 500000;
  if (sanitized.length > MAX_TEXT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_TEXT_LENGTH) + '\n\n[Text gekürzt - Datei zu lang]';
  }

  // Normalize line endings
  sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Parses PDF file with improved Unicode support
 * Handles Umlaute (äöü) and special characters correctly
 */
async function parsePDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Configure PDF.js to use CMap for proper Unicode support
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/' + pdfjsLib.version + '/cmaps/',
      cMapPacked: true,
      // Enable standard font data for better character mapping
      standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/' + pdfjsLib.version + '/standard_fonts/'
    } as any).promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const textContent = await (page.getTextContent as any)({
        // Include extra properties for better text handling
        includeMarkedContent: false
      });
      
      // Group items by line based on transform matrix
      const lines: string[][] = [];
      let currentLine: string[] = [];
      let lastY: number | null = null;
      
      for (const item of textContent.items) {
        // Type guard for TextItem
        if (!item || typeof item !== 'object' || !('str' in item)) {
          continue;
        }
        
        const textItem = item as { 
          str: string; 
          hasEOL?: boolean;
          transform?: number[];
          dir?: string;
        };
        
        // Get Y position from transform matrix (index 5 is Y translation)
        const currentY: number | null = textItem.transform?.[5] ?? lastY;
        
        // Check if we're on a new line (Y position changed significantly)
        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 3) {
          if (currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = [];
          }
        }
        
        lastY = currentY;
        
        // Decode the string properly - handle Unicode escape sequences
        let decodedStr = textItem.str;
        
        // Handle common PDF encoding issues
        // Replace Unicode replacement character with nothing
        decodedStr = decodedStr.replace(/\uFFFD/g, '');
        
        // Note: Additional encoding fixes are applied in fixPdfEncoding() after all text is collected
        
        // Only add non-empty strings
        if (decodedStr.trim().length > 0 || decodedStr === ' ') {
          currentLine.push(decodedStr);
        }
        
        // Handle end of line marker
        if (textItem.hasEOL && currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = [];
          lastY = null;
        }
      }
      
      // Don't forget the last line
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      
      // Join lines with proper spacing
      let pageText = lines
        .map(line => line.join(''))
        .join('\n')
        .trim();
      
      // Fix hyphenation at line breaks (common in PDFs)
      // Pattern: word- followed by word on next line -> wordword
      pageText = pageText.replace(/(\w)-\n+(\w)/g, '$1$2');
      
      // Also handle soft hyphens and common hyphenation patterns
      pageText = pageText.replace(/(\w)[\u00AD\u2010\u2011]\n*(\w)/g, '$1$2');
      
      // Fix broken words: single letter (often capital) followed by rest of word
      // Pattern: "M\nachine" -> "Machine" (common in PDF column layouts)
      // ONLY apply when the single letter is a single character line
      const textLines = pageText.split('\n');
      const processedLines: string[] = [];
      let idx = 0;
      while (idx < textLines.length) {
        const current = textLines[idx];
        const next = textLines[idx + 1];
        // Only merge if current line is exactly one letter and next starts with lowercase
        if (current && next && 
            current.trim().length === 1 && 
            /^[A-Za-z]$/.test(current.trim()) &&
            /^[a-zäöüß]/.test(next.trim())) {
          processedLines.push(current.trim() + next);
          idx += 2;
        } else {
          processedLines.push(current);
          idx++;
        }
      }
      pageText = processedLines.join('\n');
      
      // Remove author affiliation lines (common in academic papers)
      // Pattern: "1Facebook AI Research", "2New York University", "3Department..."
      const lines3 = pageText.split('\n');
      const filteredLines: string[] = [];
      let skipUntilContent = false;
      
      for (let i = 0; i < lines3.length; i++) {
        const line = lines3[i];
        const trimmed = line.trim();
        
        // Detect affiliation: starts with digit + uppercase, contains university/research org
        const isAffiliationStart = /^\d+[A-Z]/.test(trimmed) && 
          /(?:University|Research|College|Institute|Department|Google|Facebook)/i.test(trimmed);
        
        // Detect address continuation
        const isAddressLine = /^(?:\d+)?(?:PO\s*Box|Broadway|Parkway|California|Québec|Montreal|Toronto|Canada|USA)/i.test(trimmed);
        
        if (isAffiliationStart) {
          skipUntilContent = true;
          continue;
        } else if (skipUntilContent && (isAddressLine || trimmed.length < 50)) {
          continue;
        } else if (skipUntilContent && trimmed.length > 0) {
          skipUntilContent = false;
        }
        
        filteredLines.push(line);
      }
      pageText = filteredLines.join('\n');
      
      // Remove footnote reference lines (standalone numbers or number ranges)
      // Pattern: "8", "9,10", "11", "1-4", "5-7" (with optional trailing comma/period)
      pageText = pageText.replace(/^\s*\d{1,2}(?:[-,]\d{1,2})?[,.]?\s*$/gm, '');
      
      // Remove lines with only punctuation (isolated commas, periods, etc.)
      pageText = pageText.replace(/^\s*[,.;:]\s*$/gm, '');
      
      // Move leading punctuation to previous line
      // Pattern: "\n, " -> ", " (comma at start of line)
      // Pattern: "\n. " -> ". " (period at start of line)
      pageText = pageText.replace(/\n([,;.]\s*)/g, '$1\n');
      
      // Join very short lines (≤3 chars like "it", "to", "a") with next line
      const lines2 = pageText.split('\n');
      const mergedLines2: string[] = [];
      let i2 = 0;
      while (i2 < lines2.length) {
        const current = lines2[i2]?.trim();
        const next = lines2[i2 + 1];
        if (current && next && current.length <= 3 && /^[a-zA-Z]+$/.test(current)) {
          mergedLines2.push(current + ' ' + next);
          i2 += 2;
        } else {
          mergedLines2.push(lines2[i2]);
          i2++;
        }
      }
      pageText = mergedLines2.join('\n');
      
      if (pageText) {
        fullText += pageText + '\n\n';
      }
      
      // Cleanup
      page.cleanup();
    }
    
    // Post-process to fix any remaining encoding issues
    fullText = fixPdfEncoding(fullText);
    
    return fullText.trim();
  } catch (error) {
    throw new Error(`PDF konnte nicht gelesen werden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

/**
 * Fixes common PDF encoding issues
 * Handles decomposed Unicode, combining characters, and mojibake
 */
function fixPdfEncoding(text: string): string {
  if (!text) return '';
  
  let fixed = text;
  
  // Fix 1: Handle combining diaeresis AFTER vowel (wrong order in some PDFs)
  // Pattern: vowel + combining diaeresis -> Umlaut
  // ̈ is Combining Diaeresis (¨)
  const combiningFixes: Array<[RegExp, string]> = [
    // After vowel
    [/a\u0308/g, 'ä'], [/o\u0308/g, 'ö'], [/u\u0308/g, 'ü'],
    [/A\u0308/g, 'Ä'], [/O\u0308/g, 'Ö'], [/U\u0308/g, 'Ü'],
    // Before vowel (some PDFs have wrong order)
    [/\u0308a/g, 'ä'], [/\u0308o/g, 'ö'], [/\u0308u/g, 'ü'],
    [/\u0308A/g, 'Ä'], [/\u0308O/g, 'Ö'], [/\u0308U/g, 'Ü'],
  ];
  
  for (const [pattern, replacement] of combiningFixes) {
    fixed = fixed.replace(pattern, replacement);
  }
  
  // Fix 2: Handle standalone diaeresis followed by letter (PDF artifacts)
  // ¨ is the standalone diaeresis character
  fixed = fixed.replace(/\u00A8([aouAOU])/g, (_, vowel) => {
    const map: Record<string, string> = {
      'a': 'ä', 'o': 'ö', 'u': 'ü',
      'A': 'Ä', 'O': 'Ö', 'U': 'Ü'
    };
    return map[vowel] || vowel;
  });
  
  // Fix 3: Unicode Normalization (NFC composes decomposed characters)
  fixed = fixed.normalize('NFC');
  
  // Fix 4: Mojibake - UTF-8 interpreted as Latin-1
  const mojibakeMap: Record<string, string> = {
    'Ã¤': 'ä', 'Ã¶': 'ö', 'Ã¼': 'ü',
    'Ã': 'Ä', 'Ã': 'Ö', 'Ã': 'Ü',
    'Ã': 'ß',
  };
  
  for (const [pattern, replacement] of Object.entries(mojibakeMap)) {
    fixed = fixed.split(pattern).join(replacement);
  }
  
  // Fix 5: Clean up any remaining isolated combining characters
  // Remove combining diaeresis that's not part of a proper Umlaut
  fixed = fixed.replace(/\u0308/g, '');
  fixed = fixed.replace(/\u00A8/g, ''); // standalone diaeresis
  
  // Clean up multiple spaces
  fixed = fixed.replace(/ +/g, ' ');
  fixed = fixed.replace(/\n +/g, '\n');
  
  // Remove excessive blank lines (more than 2)
  fixed = fixed.replace(/\n{3,}/g, '\n\n');
  
  return fixed.trim();
}

/**
 * Parses DOCX file
 */
async function parseDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    throw new Error(`DOCX konnte nicht gelesen werden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

/**
 * Parses DOC file (older Word format)
 * Note: Limited support, falls back to text extraction
 */
async function parseDOC(file: File): Promise<string> {
  try {
    // Try mammoth first (has limited DOC support)
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (result.value && result.value.trim().length > 0) {
      return result.value;
    }
    throw new Error('DOC-Format nicht unterstützt. Bitte speichere als DOCX.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('DOCX')) {
      throw error;
    }
    throw new Error('DOC konnte nicht gelesen werden. Bitte konvertiere zu DOCX oder PDF.');
  }
}

/**
 * Parses PPTX file
 */
async function parsePPTX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Use JSZip to extract text from PPTX (which is a ZIP file)
    const JSZip = await import('jszip');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zip: any = await JSZip.default.loadAsync(arrayBuffer);
    
    let fullText = '';
    
    // Find all slide XML files
    const slideFiles = Object.keys(zip.files).filter(name => 
      name.match(/ppt\/slides\/slide\d+\.xml/)
    );
    
    // Sort slides by number
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
      return numA - numB;
    });
    
    for (const slideFile of slideFiles) {
      const content = await zip.files[slideFile].async('text');
      
      // Extract text between <a:t> tags (text elements in PPTX)
      const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g);
      if (textMatches) {
        const slideText = textMatches
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((match: any) => match.replace(/<a:t>(.*?)<\/a:t>/, '$1'))
          .join(' ');
        
        if (slideText.trim()) {
          fullText += `[Folie ${slideFiles.indexOf(slideFile) + 1}]\n${slideText}\n\n`;
        }
      }
    }
    
    if (!fullText.trim()) {
      throw new Error('Kein Text in der Präsentation gefunden.');
    }
    
    return fullText;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Kein Text')) {
      throw error;
    }
    throw new Error(`PPTX konnte nicht gelesen werden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

/**
 * Parses PPT file (older PowerPoint format)
 * Limited support - warns user
 */
async function parsePPT(_file: File): Promise<string> {
  // PPT binary format is complex; we can't easily parse it client-side
  throw new Error(
    'Das alte PPT-Format wird nicht unterstützt. ' +
    'Bitte speichere die Datei als PPTX (PowerPoint 2007 oder neuer).'
  );
}

/**
 * Parses TXT file
 */
async function parseTXT(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          // Apply same encoding fixes as for PDFs
          resolve(fixPdfEncoding(result));
        } else {
          reject(new Error('Text konnte nicht gelesen werden.'));
        }
      } catch (error) {
        reject(new Error('Fehler beim Lesen der Textdatei.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Fehler beim Lesen der Datei.'));
    };
    
    // Read as text with UTF-8 encoding
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Main file parsing function
 */
export async function parseFile(file: File): Promise<ParsedFile> {
  // Validate first
  const validation = validateFile(file);
  if (!validation.valid) {
    return {
      text: '',
      fileName: file.name,
      wordCount: 0,
      error: validation.error,
    };
  }

  try {
    let text = '';
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    // Route to appropriate parser based on extension or MIME type
    switch (extension) {
      case 'pdf':
        text = await parsePDF(file);
        break;
      case 'docx':
        text = await parseDOCX(file);
        break;
      case 'doc':
        text = await parseDOC(file);
        break;
      case 'pptx':
        text = await parsePPTX(file);
        break;
      case 'ppt':
        text = await parsePPT(file);
        break;
      case 'txt':
      default:
        text = await parseTXT(file);
        break;
    }

    // Sanitize extracted text
    const sanitizedText = sanitizeText(text);
    
    // Count words
    const wordCount = sanitizedText
      .split(/\s+/)
      .filter(w => w.length > 0).length;

    return {
      text: sanitizedText,
      fileName: file.name,
      wordCount,
    };
  } catch (error) {
    return {
      text: '',
      fileName: file.name,
      wordCount: 0,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Parsen',
    };
  }
}

/**
 * Gets supported file types for display
 */
export function getSupportedFileTypes(): string {
  return ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(', ');
}

/**
 * Gets supported MIME types for accept attribute
 */
export function getSupportedMimeTypes(): string {
  return Object.keys(ALLOWED_TYPES).join(', ');
}
