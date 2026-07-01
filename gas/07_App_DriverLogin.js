/**
 * Bridge email login — MVP only. Replace with OTP / unified identity later.
 * Validates email against Driver_Master or SETTINGS.BRIDGE_ADMINS.
 */

function handleVerifyDriverLogin_(data) {
  const tokenPresent = Boolean(data && data.uploadToken);
  const email = normalizeLoginEmail_(data && data.email);

  if (!isUploadAuthorized_(data && data.uploadToken)) {
    return loginJsonResponse_("error", {
      message: "Unauthorized",
      loginDiag: buildLoginDiag_(email, {
        tokenPresent: tokenPresent,
        routeMatched: true,
        isBridgeAdmin: false,
        driverMatchFound: false,
      }),
    });
  }

  if (!email || !isValidLoginEmail_(email)) {
    return loginJsonResponse_("error", {
      message: "Access denied",
      loginDiag: buildLoginDiag_(email, {
        tokenPresent: true,
        routeMatched: true,
        isBridgeAdmin: false,
        driverMatchFound: false,
      }),
    });
  }

  const adminProfile = lookupBridgeAdminProfile_(email);
  if (adminProfile) {
    return loginJsonResponse_("success", {
      profile: adminProfile,
      loginDiag: buildLoginDiag_(email, {
        tokenPresent: true,
        routeMatched: true,
        isBridgeAdmin: true,
        driverMatchFound: false,
      }),
    });
  }

  const driverProfile = lookupDriverProfileByEmail_(email);
  if (!driverProfile) {
    return loginJsonResponse_("error", {
      message: "Access denied",
      loginDiag: buildLoginDiag_(email, {
        tokenPresent: true,
        routeMatched: true,
        isBridgeAdmin: false,
        driverMatchFound: false,
      }),
    });
  }

  return loginJsonResponse_("success", {
    profile: driverProfile,
    loginDiag: buildLoginDiag_(email, {
      tokenPresent: true,
      routeMatched: true,
      isBridgeAdmin: false,
      driverMatchFound: true,
    }),
  });
}

function buildLoginDiag_(email, flags) {
  return {
    emailNormalized: email || "",
    tokenPresent: Boolean(flags && flags.tokenPresent),
    routeMatched: Boolean(flags && flags.routeMatched),
    isBridgeAdmin: Boolean(flags && flags.isBridgeAdmin),
    driverMatchFound: Boolean(flags && flags.driverMatchFound),
  };
}

function loginJsonResponse_(status, payload) {
  return ContentService
    .createTextOutput(JSON.stringify(Object.assign({ status: status }, payload)))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeLoginEmail_(raw) {
  return String(raw || "").trim().toLowerCase();
}

function isValidLoginEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function maskEmail_(email) {
  const parts = String(email || "").split("@");
  if (parts.length !== 2) return "***";
  const local = parts[0];
  const domain = parts[1];
  if (!local) return "***@" + domain;
  const maskedLocal =
    local.length <= 2
      ? "**"
      : local.charAt(0) + "***" + local.charAt(local.length - 1);
  return maskedLocal + "@" + domain;
}

function lookupBridgeAdminProfile_(email) {
  const admins = (SETTINGS && SETTINGS.BRIDGE_ADMINS) || {};
  const normalized = normalizeLoginEmail_(email);
  if (!normalized) return null;

  if (admins[normalized]) {
    return buildBridgeAdminProfile_(normalized, admins[normalized]);
  }

  const keys = Object.keys(admins);
  for (let i = 0; i < keys.length; i++) {
    if (normalizeLoginEmail_(keys[i]) === normalized) {
      return buildBridgeAdminProfile_(normalized, admins[keys[i]]);
    }
  }

  return null;
}

function buildBridgeAdminProfile_(email, entry) {
  if (!entry) return null;
  return {
    authRole: "admin",
    driverId: entry.driverId || "",
    driverName: entry.driverName || "",
    companyCode: entry.companyCode || "ELM",
    maskedEmail: maskEmail_(email),
    uploaderAllowed: true,
    active: true,
    canSelectAnyDriver: true,
  };
}

function lookupDriverProfileByEmail_(email) {
  const ss = SpreadsheetApp.openById(SETTINGS.SPREADSHEET_ID);
  const sh = ss.getSheetByName("Driver_Master");
  if (!sh || sh.getLastRow() < 2) return null;

  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || "").trim().toLowerCase();
  });

  const emailIdx = findHeaderIndex_(headers, ["email", "driveremail", "emailaddress"]);
  const driverIdIdx = findHeaderIndex_(headers, ["driverid", "id"]);
  const driverNameIdx = findHeaderIndex_(headers, ["drivername", "name"]);
  const companyIdx = findHeaderIndex_(headers, ["companycode", "company", "org"]);
  const showIdx = findHeaderIndex_(headers, ["showinuploader", "uploadervisibilityflag"]);
  const activeIdx = findHeaderIndex_(headers, ["isactive", "active"]);

  if (emailIdx === -1) return null;

  const values = sh.getRange(2, 1, sh.getLastRow() - 1, lastCol).getValues();

  for (let i = 0; i < values.length; i++) {
    const rowEmail = normalizeLoginEmail_(values[i][emailIdx]);
    if (!rowEmail || rowEmail !== email) continue;

    const driverName = String(
      driverNameIdx !== -1 ? values[i][driverNameIdx] : values[i][1] || ""
    ).trim();
    if (!driverName) return null;

    const active = isTruthyFlag_(activeIdx !== -1 ? values[i][activeIdx] : true);
    if (!active) return null;

    const uploaderAllowed = isUploaderVisibilityAllowed_(
      showIdx !== -1 ? values[i][showIdx] : ""
    );
    if (!uploaderAllowed) return null;

    const driverId = String(
      driverIdIdx !== -1 ? values[i][driverIdIdx] : values[i][0] || ""
    ).trim();
    const companyCode = String(
      companyIdx !== -1 ? values[i][companyIdx] : ""
    ).trim().toUpperCase();

    return {
      authRole: "driver",
      driverId: driverId,
      driverName: driverName,
      companyCode: companyCode,
      maskedEmail: maskEmail_(email),
      uploaderAllowed: true,
      active: true,
      canSelectAnyDriver: false,
    };
  }

  return null;
}

function findHeaderIndex_(headers, candidates) {
  for (let c = 0; c < candidates.length; c++) {
    const idx = headers.indexOf(String(candidates[c]).toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

function isTruthyFlag_(value) {
  return value === true || String(value || "").trim().toLowerCase() === "true";
}

/** Blank ShowInUploader / uploader flag = allow active driver (MVP). */
function isUploaderVisibilityAllowed_(value) {
  if (value === null || value === undefined) return true;
  const raw = String(value).trim();
  if (!raw) return true;
  return isTruthyFlag_(value);
}
