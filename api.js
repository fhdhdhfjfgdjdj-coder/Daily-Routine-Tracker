/**
 * api.js
 * -----------------------------------------------------------------------
 * ชั้นเชื่อมต่อ (API layer) ระหว่าง Frontend กับ Google Apps Script Web App
 * ใช้ fetch() ทั้งหมด และคุยกันด้วย JSON
 *
 * หมายเหตุสำคัญเรื่อง CORS:
 * Google Apps Script Web App ไม่รองรับ preflight request (OPTIONS)
 * ดังนั้นฝั่ง POST เราจึงส่ง Content-Type เป็น "text/plain;charset=utf-8"
 * (ไม่ใช่ application/json) เพื่อให้ browser มองว่าเป็น "simple request"
 * และไม่ยิง preflight ออกไป ฝั่ง Code.gs จะ parse ตัวข้อความเป็น JSON เอง
 * -----------------------------------------------------------------------
 */

const Api = {
  /**
   * ดึงรายการกิจวัตรทั้งหมดจาก Google Sheets
   * @returns {Promise<Array>} รายการกิจวัตร
   */
  async getRoutines() {
    const res = await fetch(`${CONFIG.API_URL}?action=list`, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
    }

    const json = await res.json();

    if (!json.success) {
      throw new Error(json.message || "โหลดข้อมูลไม่สำเร็จ");
    }

    return json.data || [];
  },

  /**
   * เพิ่มกิจวัตรใหม่
   * @param {{date:string, time:string, activity:string, status:string, note:string}} routine
   */
  async addRoutine(routine) {
    return Api._post({
      action: "add",
      ...routine,
    });
  },

  /**
   * แก้ไขกิจวัตรที่มีอยู่ (ต้องมี id)
   * @param {{id:string, date:string, time:string, activity:string, status:string, note:string}} routine
   */
  async updateRoutine(routine) {
    return Api._post({
      action: "update",
      ...routine,
    });
  },

  /**
   * ลบกิจวัตรตาม id
   * @param {string} id
   */
  async deleteRoutine(id) {
    return Api._post({
      action: "delete",
      id,
    });
  },

  /**
   * ฟังก์ชันภายในสำหรับส่งคำขอ POST ไปยัง Apps Script
   * @param {object} payload
   */
  async _post(payload) {
    const res = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`ส่งข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
    }

    const json = await res.json();

    if (!json.success) {
      throw new Error(json.message || "ส่งข้อมูลไม่สำเร็จ");
    }

    return json.data;
  },
};
const config = require('./config.js');

// ฟังก์ชันสำหรับส่งข้อความเข้า Discord
async function sendDiscordNotification(message) {
  try {
    await fetch(config.discordWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: message // ข้อความที่จะส่ง
      }),
    });
    console.log('ส่งแจ้งเตือนเข้า Discord สำเร็จ');
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการส่งแจ้งเตือน:', error);
  }
}

// ตัวอย่างการนำไปเรียกใช้ในโค้ดของคุณ
sendDiscordNotification("🔔 มีการอัปเดตระบบ หรือมีกิจกรรมใหม่เกิดขึ้น!");
