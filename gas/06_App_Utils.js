/** Upload auth diagnostics (temporary) — logs metadata only, never token values. */
var UPLOAD_TOKEN_PROPERTY_KEY_ = "UPLOAD_TOKEN";

function getExpectedUploadToken_() {
  return PropertiesService.getScriptProperties().getProperty(UPLOAD_TOKEN_PROPERTY_KEY_) || "";
}

function getUploadAuthDiag_(uploadToken, parsedData) {
  const expected = getExpectedUploadToken_();
  const expectedStr = String(expected || "");
  const receivedStr = String(uploadToken || "");
  return {
    propertyKey: UPLOAD_TOKEN_PROPERTY_KEY_,
    expectedExists: Boolean(expected),
    receivedExists: Boolean(uploadToken),
    expectedLength: expectedStr.length,
    receivedLength: receivedStr.length,
    expectedTrimWouldChange: expectedStr !== expectedStr.trim(),
    receivedTrimWouldChange: receivedStr !== receivedStr.trim(),
    strictMatch: expectedStr === receivedStr,
    trimMatch: expectedStr.trim() === receivedStr.trim(),
    parseHasUploadTokenKey:
      parsedData && Object.prototype.hasOwnProperty.call(parsedData, "uploadToken"),
    parseUploadTokenType:
      uploadToken === null ? "null" :
        uploadToken === undefined ? "undefined" :
          typeof uploadToken,
    jsonParsed: Boolean(parsedData),
  };
}

function isUploadAuthorized_(uploadToken) {
  const expected = getExpectedUploadToken_();
  if (!expected) return false;
  if (!uploadToken) return false;
  return String(uploadToken) === String(expected);
}

function isAllowedUploadCompany_(company) {
  return company === "BST" || company === "GLX";
}

function toCityState_(value) {
  const raw = (value || "").toString().trim();
  if (!raw) return "Unknown";

  let s = raw.replace(/\s+/g, " ").replace(/\n/g, " ").trim();

  const commaMatch = s.match(/^(.+?),\s*([A-Za-z]{2})\b/);
  if (commaMatch) {
    return `${commaMatch[1].trim().toUpperCase()}, ${commaMatch[2].toUpperCase()}`;
  }

  const tokens = s.split(" ").filter(Boolean);
  let stIdx = -1;
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (/^[A-Za-z]{2}$/.test(tokens[i])) { stIdx = i; break; }
  }
  if (stIdx === -1) return s.toUpperCase();

  const state = tokens[stIdx].toUpperCase();
  const city = tokens.slice(0, stIdx).join(" ").trim().toUpperCase();
  if (!city) return `Unknown, ${state}`;
  return `${city}, ${state}`;
}

function triggerPermissions() {
  const ss = SpreadsheetApp.openById(SETTINGS.SPREADSHEET_ID);
  MailApp.sendEmail(Session.getActiveUser().getEmail(), "ELM Permission Refresh", "Permissions are now active.");
  const folder = DriveApp.getFolderById(SETTINGS.FOLDERS.BST.bol);
  Logger.log("Drive Access Verified: " + folder.getName());
}