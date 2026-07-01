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

  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const headerMap = {};
  headers.forEach(function (h, i) {
    headerMap[String(h || "").trim().toLowerCase()] = i;
  });

  const truckIdx = headerMap.trucknumber !== undefined ? headerMap.trucknumber : 0;
  const values = sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).getValues();
  const seen = new Set();
  const trucks = [];

  for (let i = 0; i < values.length; i++) {
    const truckNumber = String(values[i][truckIdx] || "").trim();
    if (!truckNumber) continue;
    const key = truckNumber.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    trucks.push(truckNumber);
  }

  trucks.sort(function (a, b) {
    return a.localeCompare(b, undefined, { numeric: true });
  });

  return ContentService
    .createTextOutput(JSON.stringify(trucks))
    .setMimeType(ContentService.MimeType.JSON);
}
