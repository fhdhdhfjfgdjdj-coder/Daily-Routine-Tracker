/**
 * config.js
 * -----------------------------------------------------------------------
 * ⚠️ Discord Webhook URL และ LINE Token ที่เคยอยู่ในไฟล์นี้ถูกย้ายออกแล้ว
 * เพราะไฟล์นี้รันบนเบราว์เซอร์ของทุกคนที่เข้าเว็บ — ใครก็กด "View Source"
 * หรือเปิด DevTools แล้วเห็น secrets ได้ทันที
 *
 * ตอนนี้ Discord/LINE ถูกตั้งค่าใหม่ให้ปลอดภัยขึ้น โดยเก็บไว้ฝั่งเซิร์ฟเวอร์
 * ใน Google Apps Script (Code.gs) ผ่านเมนู "⚙️ Daily Routine Tracker"
 * ในสเปรดชีต แทน (ดูขั้นตอนเต็มในคำแนะนำการติดตั้ง)
 * -----------------------------------------------------------------------
 */

const CONFIG = {
  // วาง URL ของเว็บแอปที่ได้จาก Google Apps Script หลัง Deploy > New deployment
  // รูปแบบ: https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXX/exec
  API_URL: "https://script.google.com/macros/s/AKfycbz0ZUw38IYYAzCepRO0LGcH2eVJiAwAOlRiYGDYm9Q/dev",
};
