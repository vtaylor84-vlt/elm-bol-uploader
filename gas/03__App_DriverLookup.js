function getDriversData() {
    const ss = SpreadsheetApp.openById("1QHw1tFqvx_vRz0biAkqRdOriA3zVpDzF3MHI6RqllPg");
    const sh = ss.getSheetByName("Driver_Master");
  
    if (!sh) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: "Missing sheet: Driver_Master" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  
    const lastRow = sh.getLastRow();
    if (lastRow < 2) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
  
    // Driver_Master:
    // A = driverId
    // B = driverName
    // Y = ShowInUploader
    // AB = IsActive
    const values = sh.getRange(2, 1, lastRow - 1, 28).getValues();
  
    const seen = new Set();
    const drivers = [];
  
    for (let i = 0; i < values.length; i++) {
      const driverName = String(values[i][1] || "").trim();
      const showInUploader = values[i][24];
      const isActive = values[i][27];
  
      if (!driverName) continue;
  
      const show =
        showInUploader === true ||
        String(showInUploader || "").trim().toLowerCase() === "true";
  
      const active =
        isActive === true ||
        String(isActive || "").trim().toLowerCase() === "true";
  
      if (!show || !active) continue;
  
      const key = driverName.toUpperCase();
      if (seen.has(key)) continue;
      seen.add(key);
  
      drivers.push(driverName);
    }
  
    drivers.sort((a, b) => a.localeCompare(b));
  
    return ContentService
      .createTextOutput(JSON.stringify(drivers))
      .setMimeType(ContentService.MimeType.JSON);
  }