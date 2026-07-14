/**
 * config.js
 * -----------------------------------------------------------------------
 * ตั้งค่า URL ของ Google Apps Script Web App ที่นี่
 *
 * วิธีหา URL:
 * 1. เปิดโปรเจกต์ Google Apps Script ที่ผูกกับ Google Sheet ของคุณ
 * 2. กด Deploy > New deployment > เลือกประเภท "Web app"
 * 3. ตั้งค่า Execute as: Me, Who has access: Anyone
 * 4. หลัง Deploy จะได้ URL รูปแบบ
 *    https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXXX/exec
 * 5. นำ URL ที่ได้มาแทนที่ค่าด้านล่างนี้
 * -----------------------------------------------------------------------
 */

const CONFIG = {
  // แทนที่ด้วย Web App URL ของ Google Apps Script ที่ Deploy แล้ว
  API_URL: "https://script.google.com/macros/s/AKfycbw9pOux-Evvi5kRSR2AvlW5yHTZDMhnzykWRz_tHM9o6XNLe2BqGD1HjxTDzpsZ5A4X/exec",
};
