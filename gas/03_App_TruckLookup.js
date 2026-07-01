function getTrucksData() {
  const ss = SpreadsheetApp.openById(SETTINGS.SPREADSHEET_ID);
  const sh = ss.getSheetByName("Truck_Master");

  if (!sh) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: "Missing sheet: Truck_Master" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const lastRow = sh.getLastRow();
  if (lastRow < 2) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const headerMap = {};
  headers.forEach(function (h, i) {
    const key = String(h || "").trim().toLowerCase().replace(/[\s#_-]+/g, "");
    headerMap[key] = i;
  });

  function colIndex(candidates, fallback) {
    for (let c = 0; c < candidates.length; c++) {
      const key = candidates[c];
      if (headerMap[key] !== undefined) return headerMap[key];
    }
    return fallback;
  }

  const truckIdx = colIndex(
    ["trucknumber", "trucknum", "truck", "truckid", "unitnumber", "unit"],
    0
  );
  const companyIdx = colIndex(
    ["companycode", "company", "carriercode", "carrier", "tenant"],
    -1
  );
  const values = sh.getRange(2, 1, lastRow, lastCol).getValues();
  const seen = new Set();
  const trucks = [];

  for (let i = 0; i < values.length; i++) {
    const truckNumber = String(values[i][truckIdx] || "").trim();
    if (!truckNumber) continue;

    const key = truckNumber.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const companyCode = companyIdx >= 0
      ? String(values[i][companyIdx] || "").trim().toUpperCase()
      : "";

    trucks.push({
      truckNumber: truckNumber,
      companyCode: companyCode
    });
  }

  trucks.sort(function (a, b) {
    return String(a.truckNumber).localeCompare(String(b.truckNumber), undefined, { numeric: true });
  });

  return ContentService
    .createTextOutput(JSON.stringify(trucks))
    .setMimeType(ContentService.MimeType.JSON);
}
