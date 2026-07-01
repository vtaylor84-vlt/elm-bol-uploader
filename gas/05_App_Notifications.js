function maskEmailForDiag_(email) {
  const raw = String(email || '').trim().toLowerCase();
  const at = raw.indexOf('@');
  if (at <= 0) return raw || '';
  const local = raw.slice(0, at);
  const domain = raw.slice(at + 1);
  const maskedLocal = local.length <= 1 ? '*' : local.charAt(0) + '***';
  return maskedLocal + '@' + domain;
}

function testGlxSenderAliases() {
  if (!SETTINGS.GLX_SENDER || !SETTINGS.GLX_SENDER.from) {
    const missing = { error: 'GLX_SENDER_MISSING', hint: 'Add GLX_SENDER to 00_App_Config.js' };
    Logger.log(JSON.stringify(missing, null, 2));
    console.warn('GLX_SENDER_MISSING');
    return missing;
  }

  const expectedAlias = String(SETTINGS.GLX_SENDER.from || '').trim().toLowerCase();
  let aliases = [];
  try {
    aliases = GmailApp.getAliases().map(function (a) {
      return String(a).trim().toLowerCase();
    });
  } catch (err) {
    console.warn('GLX_SENDER_ALIAS_CHECK_FAILED');
  }

  const aliasAvailable = isGlxSenderAliasAvailable_();
  const result = {
    expectedAlias: expectedAlias,
    aliasCount: aliases.length,
    aliasesMasked: aliases.map(maskEmailForDiag_),
    maintenanceAliasAvailable: aliasAvailable,
    executorMasked: maskEmailForDiag_(Session.getEffectiveUser().getEmail()),
  };

  Logger.log(JSON.stringify(result, null, 2));
  if (!aliasAvailable) {
    console.warn('GLX_SENDER_ALIAS_MISSING', expectedAlias);
  }
  return result;
}

function isGlxSenderAliasAvailable_() {
  const aliasEmail = String(SETTINGS.GLX_SENDER.from || '').trim().toLowerCase();
  if (!aliasEmail) return false;

  try {
    const aliases = GmailApp.getAliases().map(function (a) {
      return String(a).trim().toLowerCase();
    });
    return aliases.indexOf(aliasEmail) !== -1;
  } catch (err) {
    console.warn('GLX_SENDER_ALIAS_CHECK_FAILED');
    return false;
  }
}

function sendGlxUploadNotificationEmail_(to, subject, emailBody, htmlBody, pdfBlob) {
  const sender = SETTINGS.GLX_SENDER;

  if (isGlxSenderAliasAvailable_()) {
    GmailApp.sendEmail(to, subject, emailBody, {
      htmlBody: htmlBody,
      attachments: [pdfBlob],
      from: sender.from,
      name: sender.name,
      replyTo: sender.replyTo,
    });
    return;
  }

  console.warn('GLX_SENDER_ALIAS_MISSING', String(sender.from || '').trim().toLowerCase());
  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: emailBody,
    htmlBody: htmlBody,
    attachments: [pdfBlob],
  });
}

function sendNotifications(company, driverName, cleanLoad, bolProtocol, originFormatted, destFormatted, pdfUrl, pdfBlob, formattedName, docTypeForFile) {
    const emailBody =
      `${bolProtocol} received\n` +
      `Carrier: ${company}\n` +
      `Driver: ${driverName}\n` +
      `Load#: ${cleanLoad}\n` +
      `Type: ${bolProtocol === "PICKUP" ? "Pickup" : "Delivery"}\n` +
      `Route: ${originFormatted.replace(",", "")} - ${destFormatted.replace(",", "")}\n\n` +
      `View Document:\n${pdfUrl}\n`;
  
    const htmlBody =
      `<div style="font-family:Arial,sans-serif;line-height:1.6">
          <div><b>${bolProtocol} received</b></div>
          <div><b>Carrier:</b> ${company}</div>
          <div><b>Driver:</b> ${driverName}</div>
          <div><b>Load#:</b> ${cleanLoad}</div>
          <div><b>Type:</b> ${bolProtocol === "PICKUP" ? "Pickup" : "Delivery"}</div>
          <div><b>Route:</b> ${originFormatted.replace(",", "")} - ${destFormatted.replace(",", "")}</div>
          <br/>
          <div><b>View Document:</b> <a href="${pdfUrl}" target="_blank">Open PDF in Drive</a></div>
        </div>`;

    const recipients = SETTINGS.EMAILS[company];

    if (company === 'GLX') {
      sendGlxUploadNotificationEmail_(recipients, formattedName, emailBody, htmlBody, pdfBlob);
    } else {
      MailApp.sendEmail({
        to: recipients,
        subject: formattedName,
        body: emailBody,
        htmlBody: htmlBody,
        attachments: [pdfBlob]
      });
    }
  
    const shortLink = pdfUrl.split('/view')[0]; 
    const smsBody = `${docTypeForFile} ${cleanLoad} - ${originFormatted.replace(",", "")} - ${destFormatted.replace(",", "")} - ${driverName}\n${shortLink}`;
    
    MailApp.sendEmail(SETTINGS.SMS_GATEWAY, "", smsBody);
  }
