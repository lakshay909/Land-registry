/**
 * Bhūmi Ledger - PDF Parser & Cadastral Ingestion Service
 * Handles magic-byte sniffing, Verhoeff Aadhaar detection & redaction,
 * UP Khatauni cadastral field extraction, freshness evaluation, and tenure transferability gating.
 */

const APPLICATION_FRESHNESS_POLICY = 90; // 90 calendar days statutory freshness limit

// D5 Dihedral Group Multiplication Table (10x10)
const dTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

// Permutation Table (8x10)
const pTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

// Inverse Table (10)
const invTable = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validates that buffer starts strictly with %PDF- at byte offset 0.
 * @param {Buffer} buffer
 * @returns {boolean}
 */
function validateMagicBytes(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 5) {
    return false;
  }
  return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}

/**
 * Validates a 12-digit number against the UIDAI Verhoeff checksum algorithm.
 * @param {string|number} numStr
 * @returns {boolean}
 */
function validateVerhoeff(numStr) {
  const digits = String(numStr).replace(/[\s-]+/g, '');
  if (!/^\d{12}$/.test(digits)) return false;
  let c = 0;
  const reversed = digits.split('').reverse().map(Number);
  for (let i = 0; i < reversed.length; i++) {
    c = dTable[c][pTable[i % 8][reversed[i]]];
  }
  return c === 0;
}

/**
 * Finds 12-digit numbers, runs validateVerhoeff, and redacts valid Aadhaar numbers
 * to XXXX-XXXX- + last 4 digits (or throws AADHAAR_DETECTED if options.throwOnDetect is true).
 * @param {string} text
 * @param {Object} [options]
 * @param {boolean} [options.throwOnDetect=false]
 * @returns {string} Redacted text
 */
function detectAndRedactAadhaar(text, options = {}) {
  if (!text || typeof text !== 'string') return text || '';
  const aadhaarRegex = /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/g;

  return text.replace(aadhaarRegex, (match) => {
    const cleanDigits = match.replace(/[\s-]+/g, '');
    if (cleanDigits.length === 12 && validateVerhoeff(cleanDigits)) {
      if (options.throwOnDetect) {
        const err = new Error('Aadhaar number detected in document payload (Section 29 Aadhaar Act violation). Ingestion halted and document discarded.');
        err.code = 'AADHAAR_DETECTED';
        throw err;
      }
      return 'XXXX-XXXX-' + cleanDigits.slice(-4);
    }
    return match;
  });
}

/**
 * Normalizes dates found in text to YYYY-MM-DD format.
 * @param {string} dateStr
 * @returns {string|null}
 */
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  // If already YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }
  // If DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

/**
 * Extracts 16-digit Gata Code, Khasra, 14-char ULPIN, Land Tenure Class, District, Tehsil, and Issue Date.
 * @param {string} text
 * @returns {Object} Extracted cadastral fields
 */
function extractCadastralFields(text) {
  const fields = {
    gataCode: null,
    khasraNumber: null,
    ulpin: null,
    tenureClass: null,
    district: null,
    tehsil: null,
    issueDate: null
  };

  if (!text || typeof text !== 'string') return fields;

  // 1. 16-digit Computerized Gata Code (UPIC)
  const gataMatch = text.match(/(?:computerized\s*(?:gata\s*code|land\s*parcel\s*code|code)|gata\s*(?:code|no|number)|गाटा\s*(?:संख्या|कोड)?|upic)[\s:=-]*(\d{16})\b/i);
  if (gataMatch) {
    fields.gataCode = gataMatch[1];
  } else {
    // Standalone 16-digit fallback
    const standaloneGata = text.match(/\b(\d{16})\b/);
    if (standaloneGata) {
      fields.gataCode = standaloneGata[1];
    }
  }

  // 2. Khasra Number
  const khasraMatch = text.match(/(?:khasra\s*(?:no|number|num)?|खसरा\s*(?:संख्या)?)[\s:=-]*([0-9]+(?:\/[0-9]+[A-Za-z]*)?)/i)
    || text.match(/(?:plot\s*(?:no|number)?|survey\s*(?:no|number)?)[\s:=-]*([0-9]+(?:\/[0-9]+[A-Za-z]*)?)/i);
  if (khasraMatch) {
    fields.khasraNumber = khasraMatch[1].trim();
  }

  // 3. 14-character alphanumeric ULPIN (Bhu-Aadhaar)
  const ulpinMatch = text.match(/(?:ulpin|bhu[- ]?aadhaar|भू[- ]?आधार)[\s:=-]*([A-Z0-9]{14})\b/i)
    || text.match(/\b([A-Z]{2}[0-9A-Z]{12})\b/);
  if (ulpinMatch) {
    fields.ulpin = ulpinMatch[1].toUpperCase();
  }

  // 4. Land Tenure Class
  const tenureMatch = text.match(/(?:tenure\s*(?:class|type|status)?|land\s*tenure|खातेदार\s*की\s*श्रेणी|श्रेणी)[\s:=-]*([A-Za-z0-9\s\-–\(\),]+?)(?=\n|;|\.|$|district|tehsil|area)/i);
  if (tenureMatch) {
    fields.tenureClass = tenureMatch[1].trim();
  } else if (/Class\s*1[- ]?Kha/i.test(text)) {
    fields.tenureClass = 'Class 1-Kha';
  } else if (/Class\s*1[- ]?Ka/i.test(text)) {
    fields.tenureClass = 'Class 1-Ka';
  } else if (/Class\s*2\b/i.test(text)) {
    fields.tenureClass = 'Class 2';
  } else if (/Class\s*3\b/i.test(text)) {
    fields.tenureClass = 'Class 3';
  } else if (/Section\s*77\b/i.test(text)) {
    fields.tenureClass = 'Section 77';
  }

  // 5. District
  const districtMatch = text.match(/(?:district|dist[.]?|जनपद|ज़िला)[\s:=-]*([A-Za-z\s]{3,30})(?:[,;\.\n]|$)/i);
  if (districtMatch) {
    fields.district = districtMatch[1].trim();
  }

  // 6. Tehsil
  const tehsilMatch = text.match(/(?:tehsil|tahsil|तहसील)[\s:=-]*([A-Za-z\s]{3,30})(?:[,;\.\n]|$)/i);
  if (tehsilMatch) {
    fields.tehsil = tehsilMatch[1].trim();
  }

  // 7. Issue Date
  const dateMatch = text.match(/(?:issue\s*date|date\s*of\s*issue|issuance\s*date|दिनांक|जारी\s*दिनांक)[\s:=-]*([0-9]{4}[-/][0-9]{2}[-/][0-9]{2}|[0-9]{2}[-/][0-9]{2}[-/][0-9]{4})/i)
    || text.match(/\b([0-9]{4}-[0-9]{2}-[0-9]{2})\b/);
  if (dateMatch) {
    fields.issueDate = normalizeDate(dateMatch[1]);
  }

  return fields;
}

/**
 * Evaluates document issuance freshness against the 90-day statutory policy.
 * @param {string} dateStr
 * @returns {Object} { isFresh: boolean, status: string, ageInDays: number|null }
 */
function checkFreshness(dateStr) {
  if (!dateStr) {
    return {
      isFresh: false,
      status: 'EXPIRED_OUTDATED',
      ageInDays: null
    };
  }

  const normalized = normalizeDate(dateStr);
  if (!normalized) {
    return {
      isFresh: false,
      status: 'EXPIRED_OUTDATED',
      ageInDays: null
    };
  }

  const issueTime = new Date(normalized).getTime();
  if (isNaN(issueTime)) {
    return {
      isFresh: false,
      status: 'EXPIRED_OUTDATED',
      ageInDays: null
    };
  }

  const now = Date.now();
  const diffTime = now - issueTime;
  const ageInDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Fresh if within 90 days and not in future
  const isFresh = ageInDays >= 0 && ageInDays <= APPLICATION_FRESHNESS_POLICY;

  return {
    isFresh,
    status: isFresh ? 'FRESH' : 'EXPIRED_OUTDATED',
    ageInDays
  };
}

/**
 * Validates Land Tenure Class transferability under UP Revenue Code, 2006.
 * Class 1-Kha / Class 1-Ka are transferable.
 * Class 2, Class 3, and Section 77 are non-transferable / public utility.
 * @param {string} tenureClass
 * @returns {Object} { isTransferable: boolean, status: string, tenureClass: string|null, reason: string|null }
 */
function checkTenureTransferability(tenureClass) {
  if (!tenureClass || typeof tenureClass !== 'string') {
    return {
      isTransferable: false,
      status: 'UNKNOWN_TENURE',
      tenureClass: null,
      reason: 'Land tenure class not specified or unreadable'
    };
  }

  const clean = tenureClass.trim();

  // Section 77 public utility / state land (Hinch Lal Tiwari precedent)
  if (/Section\s*77|Public Utility|Gram Sabha|Waterbody|पोखर|तालाब/i.test(clean)) {
    return {
      isTransferable: false,
      status: 'NON_TRANSFERABLE',
      tenureClass: clean,
      reason: 'Section 77: Public utility / state land cannot be transferred (void ab initio under Section 104)'
    };
  }

  // Class 2: Bhumidhar with Non-Transferable Rights
  if (/Class\s*2|Non[- ]?Transferable|असंक्रमणीय/i.test(clean)) {
    return {
      isTransferable: false,
      status: 'NON_TRANSFERABLE',
      tenureClass: clean,
      reason: 'Class 2: Bhumidhar with Non-Transferable Rights cannot transfer title under Section 76'
    };
  }

  // Class 3: Asami (temporary / non-transferable licensee)
  if (/Class\s*3|Asami|आसामी/i.test(clean)) {
    return {
      isTransferable: false,
      status: 'NON_TRANSFERABLE',
      tenureClass: clean,
      reason: 'Class 3: Asami tenure cannot be conveyed or transferred under Section 78'
    };
  }

  // Class 1-Kha or Class 1-Ka: Bhumidhar with Transferable Rights
  if (/Class\s*1[- ]?Kha|Class\s*1[- ]?Ka|Class\s*1\b|Transferable|संक्रमणीय/i.test(clean)) {
    return {
      isTransferable: true,
      status: 'TRANSFERABLE',
      tenureClass: clean,
      reason: null
    };
  }

  // Default fallback for unrecognized tenure
  return {
    isTransferable: false,
    status: 'UNKNOWN_TENURE',
    tenureClass: clean,
    reason: 'Unrecognized tenure class; manual revenue inspection required'
  };
}

/**
 * Resilient fallback string extractor from PDF buffer if pdf-parse is unavailable
 * or handling minimal synthetic test buffers.
 * @param {Buffer} buffer
 * @returns {string}
 */
function extractFallbackText(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) return '';
  const rawStr = buffer.toString('utf8');
  // Match text in parentheses (PDF string literals)
  const literals = rawStr.match(/\(([^()]{1,1000})\)/g);
  if (literals && literals.length > 0) {
    return literals.map(l => l.slice(1, -1)).join(' \n');
  }
  // Otherwise return ASCII printable strings
  return rawStr.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
}

/**
 * Parses a PDF deed buffer with a 5000ms execution timeout and optional parserOverride.
 * By default, options.throwOnDetect is true (rejects unmasked Aadhaar).
 * @param {Buffer} buffer
 * @param {Function} [parserOverride]
 * @param {Object} [options]
 * @param {boolean} [options.throwOnDetect=true]
 * @returns {Promise<Object>}
 */
async function parsePdfDeed(buffer, parserOverride = null, options = {}) {
  if (!validateMagicBytes(buffer)) {
    const err = new Error('Invalid PDF format: buffer does not start with %PDF-');
    err.code = 'INVALID_PDF_FORMAT';
    throw err;
  }

  const timeoutMs = 5000;
  let timer;

  const parsePromise = (async () => {
    let rawText = '';

    if (parserOverride && typeof parserOverride === 'function') {
      const overrideRes = await parserOverride(buffer);
      if (typeof overrideRes === 'string') {
        rawText = overrideRes;
      } else if (overrideRes && typeof overrideRes === 'object') {
        if (overrideRes.rawText) rawText = overrideRes.rawText;
        else if (overrideRes.text) rawText = overrideRes.text;
        else rawText = JSON.stringify(overrideRes);
      }
    } else {
      // Try pdf-parse first, with robust fallback
      try {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        rawText = data.text || '';
      } catch (err) {
        rawText = extractFallbackText(buffer);
      }
    }

    const shouldThrowOnDetect = options.throwOnDetect !== false;
    const cleanedText = detectAndRedactAadhaar(rawText, { throwOnDetect: shouldThrowOnDetect });
    const fields = extractCadastralFields(cleanedText);
    const freshness = checkFreshness(fields.issueDate);
    const transferability = checkTenureTransferability(fields.tenureClass);

    return {
      isValidPdf: true,
      rawText: cleanedText,
      fields,
      freshness,
      transferability
    };
  })();

  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`PDF parsing timed out after ${timeoutMs}ms`);
      err.code = 'PARSING_TIMEOUT';
      reject(err);
    }, timeoutMs);
  });

  try {
    return await Promise.race([parsePromise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  APPLICATION_FRESHNESS_POLICY,
  dTable,
  pTable,
  invTable,
  validateMagicBytes,
  validateVerhoeff,
  detectAndRedactAadhaar,
  extractCadastralFields,
  checkFreshness,
  checkTenureTransferability,
  parsePdfDeed
};
