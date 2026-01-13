// js/page-series-list.js
function pickSerieDesc(row) {
  // elige la mejor descripción posible sin tocar CSV
  return (
    row["Desc._Serie_promo"] ||
    row["Desc._Familia_web"] ||
    row["Desc._Familia"] ||
    row["Efecto_web"] ||
    ""
  ).trim();
}

async function initSeriesListFromCSV({ collectionKey, csvPath = "data/catalogo.csv", maxTiles = 4 }) {
  const rows = await CXData.loadCatalogo(csvPath);

  const target = CXData.normalizeKey(collectionKey);

  // Filtra por Coleccion_web (normalizado)
  const filtered = rows.filter(r => CXData.normalizeKey(r["Coleccion_web"]) === target);

  // Agrupa por Serie_web conservando el primer registro como "representativo"
  const bySerie = new Map();
  for (const r of filtered) {
    const serie = String(r["Serie_web"] || "").trim();
    if (!serie) continue;
    if (!bySerie.has(serie)) bySerie.set(serie, r);
  }

  // Construye seriesData para tu renderGrid actual
  let list = Array.from(bySerie.entries()).map(([serie, r]) => ({
    id: serie,
    name: serie,
    desc: pickSerieDesc(r),
    img: (r["URL_imagen_PIM"] || "").trim()  // ✅ lo que has pedido
  }));

  // Si hay más de 4 series, mostramos 4 (tu layout actual está pensado para 4)
  if (maxTiles && list.length > maxTiles) list = list.slice(0, maxTiles);

  // Inyecta al código existente
  seriesData = list;

  // Si no hay datos, mostramos un estado vacío sin cambiar estilos
  if (!seriesData.length) {
    const container = document.getElementById("gridContainer");
    if (container) {
      container.innerHTML = `
        <div style="color:#fff; opacity:.75; font-size:18px; padding:30px;">
          No hay series publicadas en esta colección todavía.
        </div>
      `;
    }
    return;
  }

  // Llama a tu renderGrid existente
  renderGrid();
}
