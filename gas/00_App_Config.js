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