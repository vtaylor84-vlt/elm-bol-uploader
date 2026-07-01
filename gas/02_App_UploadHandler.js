function handleUploadProcess(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (!isUploadAuthorized_(data.uploadToken)) {
      const authDiag = getUploadAuthDiag_(data.uploadToken, data);
      console.log("[upload-auth-diag]", JSON.stringify(authDiag));
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "error",
          message: "Unauthorized",
          authDiag: authDiag,
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const submissionType = String(data.submissionType || "BOL_POD").trim().toUpperCase();
    if (submissionType === "EXPENSE_RECEIPT") {
      return handleExpenseReceiptUpload_(data);
    }

    return handleBolPodUpload_(data);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleBolPodUpload_(data) {
  const {
    company,
    driverName,
    loadNum,
    bolNum,
    bolProtocol,
    files
  } = data;
  if (!isAllowedUploadCompany_(company)) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: "Invalid company"
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const cleanLoad = loadNum || bolNum || "NA";

  const originRaw =
    (data.puCity && data.puState) ? `${data.puCity} ${data.puState}` :
      (data.origin ? String(data.origin) : "");

  const destRaw =
    (data.delCity && data.delState) ? `${data.delCity} ${data.delState}` :
      (data.destination ? String(data.destination) : "");

  const originFormatted = toCityState_(originRaw);
  const destFormatted = toCityState_(destRaw);

  const isDelivery = (bolProtocol === "DELIVERY");
  const docTypeForFile = isDelivery ? "POD" : "BOL";

  const formattedName =
    `${docTypeForFile} - Load: ${cleanLoad} - ${originFormatted.replace(",", "")} - ${destFormatted.replace(",", "")}`;

  const config = SETTINGS.FOLDERS[company];
  let html = "<html><body>";

  (files || []).forEach((f, idx) => {
    const decoded = Utilities.base64Decode(f.base64.split(",")[1]);
    const blob = Utilities.newBlob(decoded, "image/jpeg");

    const folderId = (f.category === "bol")
      ? (isDelivery ? config.pod : config.bol)
      : config.freight;

    const imgName = `${company}_${docTypeForFile}_${cleanLoad}_p${idx + 1}.jpg`;
    DriveApp.getFolderById(folderId).createFile(blob.setName(imgName));

    html += `<img src="${f.base64}" style="width:100%;"><br>`;
  });

  const pdfBlob = Utilities.newBlob(html + "</body></html>", "text/html")
    .getAs("application/pdf")
    .setName(`${formattedName}.pdf`);

  const pdfFolderId = isDelivery ? config.pod : config.bol;
  const pdfFile = DriveApp.getFolderById(pdfFolderId).createFile(pdfBlob);
  const pdfUrl = pdfFile.getUrl();

  sendNotifications(company, driverName, cleanLoad, bolProtocol, originFormatted, destFormatted, pdfUrl, pdfBlob, formattedName, docTypeForFile);

  const payload = {
    company: company,
    driver: driverName,
    loadNumber: cleanLoad,
    phase: docTypeForFile,
    origin: originFormatted,
    destination: destFormatted,
    url: pdfUrl
  };

  writeDocToDB_(payload);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "success", url: pdfUrl }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleExpenseReceiptUpload_(data) {
  const company = data.company;
  const driverName = data.driverName;
  const expense = data.expense || {};
  const files = data.files || [];

  if (!isAllowedUploadCompany_(company)) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: "Invalid company"
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const config = SETTINGS.FOLDERS[company];
  const receiptFolderId = config.freight;
  const loadRef = String(expense.loadNum || expense.bolNum || "NA").trim() || "NA";
  const category = String(expense.category || "other").toUpperCase();
  const amount = Number(expense.amount) || 0;
  const expenseDate = String(expense.expenseDate || "");
  const docTypeForFile = "EXPENSE_RECEIPT";

  const formattedName =
    `EXPENSE ${category} - $${amount.toFixed(2)} - ${driverName} - ${expenseDate}`;

  let html = "<html><body>";
  html += `<h2>Expense Receipt</h2>`;
  html += `<p>Driver: ${driverName}</p>`;
  html += `<p>Category: ${category}</p>`;
  html += `<p>Amount: $${amount.toFixed(2)}</p>`;
  html += `<p>Date: ${expenseDate}</p>`;
  if (expense.loadNum) html += `<p>Load #: ${expense.loadNum}</p>`;
  if (expense.bolNum) html += `<p>BOL #: ${expense.bolNum}</p>`;
  if (expense.notes) html += `<p>Notes: ${expense.notes}</p>`;

  (files || []).forEach((f, idx) => {
    const decoded = Utilities.base64Decode(f.base64.split(",")[1]);
    const blob = Utilities.newBlob(decoded, "image/jpeg");
    const imgName = `${company}_EXPENSE_${category}_${loadRef}_p${idx + 1}.jpg`;
    DriveApp.getFolderById(receiptFolderId).createFile(blob.setName(imgName));
    html += `<img src="${f.base64}" style="width:100%;"><br>`;
  });

  const pdfBlob = Utilities.newBlob(html + "</body></html>", "text/html")
    .getAs("application/pdf")
    .setName(`${formattedName}.pdf`);

  const pdfFile = DriveApp.getFolderById(receiptFolderId).createFile(pdfBlob);
  const pdfUrl = pdfFile.getUrl();

  sendNotifications(
    company,
    driverName,
    loadRef,
    "EXPENSE",
    category,
    `$${amount.toFixed(2)}`,
    pdfUrl,
    pdfBlob,
    formattedName,
    docTypeForFile
  );

  writeDocToDB_({
    company: company,
    driver: driverName,
    loadNumber: loadRef,
    phase: docTypeForFile,
    origin: category,
    destination: `$${amount.toFixed(2)} · ${expenseDate}`,
    url: pdfUrl,
    intakeNotes: String(expense.notes || "")
  });

  return ContentService
    .createTextOutput(JSON.stringify({
      status: "success",
      url: pdfUrl,
      submissionType: "EXPENSE_RECEIPT"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
