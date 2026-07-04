/** * ELM MASTER CORE v6 - FULL POWER
 * Handles: Auto-Email, SMS, File Saving, and Document Verification
 */

const SETTINGS = {
  SPREADSHEET_ID: '1QHw1tFqvx_vRz0biAkqRdOriA3zVpDzF3MHI6RqllPg',
  FOLDERS: {
    'BST': { 
      bol: '1bZpcJcgUAyFxQZ2H5iMhN-LuNljQDd2d', 
      pod: '1QL7H9jxnI6F_WAFCc10SQnY2YsXXhU3Y', 
      freight: '1y6LMBDJr5N_V8dZxMB15uSNtEJcIi9RJ' 
    },
    'GLX': { 
      bol: '1wpW0-UY7QvDI8g080Pu9DSt44vy4wtNr', 
      pod: '1Xx2-qKf66tkL7NBUy9xtAhkpEQN33TlL', 
      freight: '1w-5JjgUvuScRfFyy8t2RWSbBkvuBVX7-' 
    }
  },
  EMAILS: {
    'BST': "Leroy@bstexpediteinc.com, nick@bstexpediteinc.com",
    'GLX': "leroy@bstexpediteinc.com"
  },
  /**
   * GLX upload notification "From" — Gmail "Send mail as" alias on the executor account.
   * Manual setup (no Apps Script ownership transfer required):
   * 1. Sign in to Gmail as the account that runs this Apps Script (USER_DEPLOYING).
   * 2. Settings → Accounts → Send mail as → Add maintenance@greenleafxpressllc.com.
   * 3. Complete Google verification for that alias.
   * 4. Run testGlxSenderAliases() in the script editor; aliasAvailable must be true.
   * GLX admins do not need Apps Script access — only this Gmail alias on the executor account.
   */
  GLX_SENDER: {
    from: 'maintenance@greenleafxpressllc.com',
    name: 'Greenleaf Xpress Maintenance',
    replyTo: 'maintenance@greenleafxpressllc.com',
  },
  SMS_GATEWAY: "9452107105@vtext.com",
  /** Temporary bridge-only upload admins — replace with real identity later. */
  BRIDGE_ADMINS: {
    'vtaylor84@gmail.com': {
      driverId: 'ADMIN-VTAYLOR',
      driverName: 'Vernon Taylor',
      companyCode: 'ELM',
    },
    'semir32@gmail.com': {
      driverId: 'ADMIN-SEMIR',
      driverName: 'Semir',
      companyCode: 'ELM',
    },
  },
};