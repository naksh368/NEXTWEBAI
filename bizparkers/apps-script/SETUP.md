# Connect enquiries to Google Sheets + admin panel (free, about 10 minutes)

1. Open https://sheets.new and name the sheet **Bizparkers Enquiries**.
2. In the sheet: **Extensions → Apps Script**. Delete what's there, paste everything from `Code.gs`, click **Save**.
3. **Project Settings (gear icon) → Script properties → Add property**:
   - `ADMIN_KEY` = a strong password for the admin panel
   - `NOTIFY_EMAIL` = the email that should get a message for every new enquiry (optional)
4. **Deploy → New deployment → type: Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, allow the permissions, and copy the **Web app URL** (ends in `/exec`).
5. Paste that URL in two places:
   - `index.html` → `CONFIG.sheetUrl`
   - `admin.html` → `SHEET_URL`
6. Open `admin.html`, sign in with your `ADMIN_KEY`.

Every enquiry from the website now lands in the sheet (tab **Enquiries**), shows up in the admin panel,
and, if `NOTIFY_EMAIL` is set, arrives in your inbox.

If you change `Code.gs` later: **Deploy → Manage deployments → Edit → Version: New version → Deploy** (the URL stays the same).
