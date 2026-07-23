/**
 * api.js
 * -----------------------------------------------------------------------
 * ชั้นเชื่อมต่อ (API layer) ระหว่าง Frontend กับ Google Apps Script Web App
 * และส่งแจ้งเตือนเข้า Discord Webhook
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
    const result = await Api._post({
      action: "add",
      ...routine,
    });

    // ส่งแจ้งเตือน Discord เมื่อเพิ่มรายการสำเร็จ
    await Api.sendDiscordNotification({
      title: "📌 บันทึกกิจวัตรใหม่สำเร็จ!",
      color: 3066993, // สีเขียว
      fields: [
        { name: "📅 วันที่", value: routine.date || "-", inline: true },
        { name: "⏰ เวลา", value: routine.time || "-", inline: true },
        { name: "📝 กิจกรรม", value: routine.activity || "-", inline: false },
        { name: "🏷️ สถานะ", value: routine.status || "-", inline: true },
        { name: "💬 หมายเหตุ", value: routine.note || "-", inline: false },
      ],
    });

    return result;
  },

  /**
   * แก้ไขกิจวัตรที่มีอยู่ (ต้องมี id)
   * @param {{id:string, date:string, time:string, activity:string, status:string, note:string}} routine
   */
  async updateRoutine(routine) {
    const result = await Api._post({
      action: "update",
      ...routine,
    });

    // ส่งแจ้งเตือน Discord เมื่อแก้ไขรายการสำเร็จ
    await Api.sendDiscordNotification({
      title: "✏️ อัปเดตรายการกิจวัตร!",
      color: 16753920, // สีส้ม
      fields: [
        { name: "📅 วันที่", value: routine.date || "-", inline: true },
        { name: "⏰ เวลา", value: routine.time || "-", inline: true },
        { name: "📝 กิจกรรม", value: routine.activity || "-", inline: false },
        { name: "🏷️ สถานะ", value: routine.status || "-", inline: true },
        { name: "💬 หมายเหตุ", value: routine.note || "-", inline: false },
      ],
    });

    return result;
  },

  /**
   * ลบกิจวัตรตาม id
   * @param {string} id
   */
  async deleteRoutine(id) {
    const result = await Api._post({
      action: "delete",
      id,
    });

    // ส่งแจ้งเตือน Discord เมื่อลบรายการสำเร็จ
    await Api.sendDiscordNotification({
      title: "🗑️ ลบรายการกิจวัตรแล้ว",
      color: 15158332, // สีแดง
      fields: [{ name: "🆔 ID รายการ", value: String(id), inline: true }],
    });

    return result;
  },

  /**
   * ฟังก์ชันส่งแจ้งเตือนเข้า Discord ผ่าน Webhook
   * @param {{title:string, color:number, fields:Array}} embedData
   */
  async sendDiscordNotification(embedData) {
    // ดึง URL จาก CONFIG ที่ประกาศไว้ใน config.js
    const webhookUrl = CONFIG.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) return;

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          embeds: [
            {
              ...embedData,
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
      console.log("ส่งแจ้งเตือนเข้า Discord สำเร็จ");
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการส่ง Discord Notification:", error);
    }
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
