function doGet(e) {
    const action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action) : "";
  
    if (action === "ping") {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, app: "ELM_UPLOADER", ts: new Date().toISOString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  
    if (action === "getDrivers") {
      return getDriversData(); // Logic moved to 03_App_DriverLookup.gs
    }

    if (action === "getTrucks") {
      return getTrucksData();
    }
  
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ELM_UPLOADER Active" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  function doPost(e) {
    try {
      const data = JSON.parse(e.postData.contents);
      if (data && data.action === "verifyDriverLogin") {
        return handleVerifyDriverLogin_(data);
      }
    } catch (parseErr) {
      // Fall through to upload handler for non-JSON or legacy payloads.
    }
    return handleUploadProcess(e);
  }