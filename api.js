/**
 * api.js
 * -----------------------------------------------------------------------
 * ชั้นเชื่อมต่อ (API layer) สำหรับจัดการข้อมูลระบบ Daily Routine
 * ผ่าน Google Apps Script Web App ที่เชื่อมกับ Google Sheets
 *
 * หมายเหตุ: การแจ้งเตือน Discord/LINE ย้ายไปทำงานฝั่งเซิร์ฟเวอร์ใน Code.gs
 * แล้ว (ทำงานอัตโนมัติหลังบันทึกลงชีตสำเร็จทุกครั้ง) เพื่อไม่ต้องฝัง
 * Webhook URL / Token ไว้ในโค้ดฝั่งเบราว์เซอร์ซึ่งใครก็ดูได้จาก View Source
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
   * เพิ่มกิจวัตรใหม่ (Code.gs จะส่งแจ้งเตือน Discord/LINE ให้อัตโนมัติ)
   * @param {{date:string, time:string, activity:string, status:string, note:string}} routine
   */
  async addRoutine(routine) {
    return Api._post({
      action: "add",
      ...routine,
    });
  },

  /**
   * แก้ไขกิจวัตรที่มีอยู่ (Code.gs จะส่งแจ้งเตือน Discord/LINE ให้อัตโนมัติ)
   * @param {{id:string, date:string, time:string, activity:string, status:string, note:string}} routine
   */
  async updateRoutine(routine) {
    return Api._post({
      action: "update",
      ...routine,
    });
  },

  /**
   * ลบกิจวัตรตาม id (Code.gs จะส่งแจ้งเตือน Discord/LINE ให้อัตโนมัติ)
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
   * ใช้ Content-Type: text/plain โดยตั้งใจ เพื่อเลี่ยง CORS preflight (OPTIONS)
   * ที่ Apps Script Web App ไม่รองรับ — ฝั่ง Code.gs จะ JSON.parse ตัว body
   * ให้เองอยู่แล้วไม่ว่า header จะระบุ content-type อะไร
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
