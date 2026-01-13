// js/data.js
(() => {
  const DEFAULT_CSV_PATH = "data/catalogo.csv";
  const CACHE_KEY = "cx_catalogo_rows_v1";
  const CACHE_RAW_KEY = "cx_catalogo_raw_v1";

  function normalizeKey(v) {
    return String(v ?? "")
      .trim()
      .toUpperCase()
      .replace(/[\s\-_]+/g, ""); // quita espacios, guiones y _
  }

  // Parser CSV robusto (maneja comillas y saltos de línea en campos)
  function parseCSV(text, delimiter = ";") {
    const rows = [];
    let i = 0, field = "", row = [];
    let inQuotes = false;

    // quitar BOM si existe
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

    const pushField = () => { row.push(field); field = ""; };
    const pushRow = () => { rows.push(row); row = []; };

    while (i < text.length) {
      const c = text[i];

      if (inQuotes) {
        if (c === '"') {
          const next = text[i + 1];
          if (next === '"') { field += '"'; i += 2; continue; } // "" -> "
          inQuotes = false; i++; continue;
        }
        field += c; i++; continue;
      }

      if (c === '"') { inQuotes = true; i++; continue; }

      // delimiter
      if (c === delimiter) { pushField(); i++; continue; }

      // newline (CRLF o LF)
      if (c === "\n" || c === "\r") {
        pushField();
        pushRow();
        if (c === "\r" && text[i + 1] === "\n") i += 2; else i++;
        continue;
      }

      field += c; i++;
    }

    // última celda
    pushField();
    if (row.length > 1 || row[0] !== "") pushRow();

    const headers = rows.shift() || [];
    return rows.map(r => {
      const obj = {};
      headers.forEach((h, idx) => { obj[String(h).trim()] = r[idx] ?? ""; });
      return obj;
    });
  }

  async function loadCatalogo(csvPath = DEFAULT_CSV_PATH, { force = false } = {}) {
    if (!force) {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        try { return JSON.parse(cached); } catch (_) {}
      }
    }

    const res = await fetch(csvPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`No se pudo cargar el CSV: ${csvPath} (${res.status})`);
    const raw = await res.text();

    const rows = parseCSV(raw, ";");
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(rows));
    sessionStorage.setItem(CACHE_RAW_KEY, raw);
    return rows;
  }

  window.CXData = { loadCatalogo, normalizeKey };
})();
