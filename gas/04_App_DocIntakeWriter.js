function writeDocToDB_(payload) {
  const ss = SpreadsheetApp.openById(SETTINGS.SPREADSHEET_ID);
  const sh = ss.getSheetByName("DB_Docs");

  const values = sh.getDataRange().getValues();
  const headers = values[0];

  const map = {};
  headers.forEach((h, i) => map[String(h || "").trim()] = i);

  const now = new Date();
  const row = new Array(headers.length).fill("");

  const docIntakeId = makeDocIntakeId_({
    timestamp: now,
    company: payload.company || "",
    driver: payload.driver || "",
    loadNumber: payload.loadNumber || "",
    documentPhase: payload.phase || "",
    documentUrl: payload.url || ""
  });

  const canonicalDriverId = lookupCanonicalDriverId_(ss, payload.driver || "");

  if (map["DocIntakeId"] !== undefined) row[map["DocIntakeId"]] = docIntakeId;
  if (map["Timestamp"] !== undefined) row[map["Timestamp"]] = now;
  if (map["Company"] !== undefined) row[map["Company"]] = payload.company || "";
  if (map["Driver"] !== undefined) row[map["Driver"]] = payload.driver || "";
  if (map["LoadNumber"] !== undefined) row[map["LoadNumber"]] = payload.loadNumber || "";
  if (map["DocumentPhase"] !== undefined) row[map["DocumentPhase"]] = payload.phase || "";
  if (map["Origin"] !== undefined) row[map["Origin"]] = payload.origin || "";
  if (map["Destination"] !== undefined) row[map["Destination"]] = payload.destination || "";
  if (map["DocumentUrl"] !== undefined) row[map["DocumentUrl"]] = payload.url || "";
  if (map["MatchStatus"] !== undefined) row[map["MatchStatus"]] = "NEW";
  if (map["SourceApp"] !== undefined) row[map["SourceApp"]] = "UPLOADER";
  if (map["UploaderVersion"] !== undefined) row[map["UploaderVersion"]] = "v7_mapped";
  if (map["CanonicalDriverId"] !== undefined) row[map["CanonicalDriverId"]] = canonicalDriverId || "";
  if (map["MatchedLoadId"] !== undefined) row[map["MatchedLoadId"]] = "";
  if (map["DocumentVersion"] !== undefined) row[map["DocumentVersion"]] = 1;
  if (map["IntakeNotes"] !== undefined) row[map["IntakeNotes"]] = payload.intakeNotes || "";
  if (map["ProcessedAt"] !== undefined) row[map["ProcessedAt"]] = "";

  sh.appendRow(row);
}

function makeDocIntakeId_(payload) {
  const raw = [
    payload.timestamp || "",
    payload.company || "",
    payload.driver || "",
    payload.loadNumber || "",
    payload.documentPhase || "",
    payload.documentUrl || ""
  ].join("|");

  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
  const hex = digest.map(function(b) {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? "0" + v : v;
  }).join("").substring(0, 16).toUpperCase();

  return "DIN-" + hex;
}

function lookupCanonicalDriverId_(ss, driverName) {
  const sh = ss.getSheetByName("Drivers");
  if (!sh || sh.getLastRow() < 2) return "";

  const values = sh.getDataRange().getValues();
  const headers = values[0].map(function(h) {
    return String(h || "").trim().toLowerCase();
  });

  const nameIdx = headers.indexOf("name");
  const canonicalIdx = headers.indexOf("canonicaldriverid");
  const driverIdIdx = headers.indexOf("driverid");

  if (nameIdx === -1) return "";

  const target = String(driverName || "").trim().toUpperCase();

  for (let i = 1; i < values.length; i++) {
    const rowName = String(values[i][nameIdx] || "").trim().toUpperCase();
    if (rowName !== target) continue;

    if (canonicalIdx !== -1 && values[i][canonicalIdx]) return values[i][canonicalIdx];
    if (driverIdIdx !== -1 && values[i][driverIdIdx]) return values[i][driverIdIdx];
    return "";
  }

  return "";
}