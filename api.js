/**
 * api.js
 * -----------------------------------------------------------------------
 * ชั้นเชื่อมต่อ (API layer) สำหรับจัดการข้อมูลระบบ Daily Routine
 * และส่งการแจ้งเตือนไปยัง Discord Webhook และ LINE Messaging API
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

    // 1. ส่งแจ้งเตือน Discord
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

    // 2. ส่งแจ้งเตือน LINE
    const lineMsg = `📌 บันทึกกิจวัตรใหม่!\n📅 วันที่: ${routine.date || '-'}\n⏰ เวลา: ${routine.time || '-'}\n📝 กิจกรรม: ${routine.activity || '-'}\n🏷️ สถานะ: ${routine.status || '-'}\n💬 หมายเหตุ: ${routine.note || '-'}`;
    await Api.sendLineNotification(lineMsg);

    return result;
  },

  /**
   * แก้ไขกิจวัตรที่มีอยู่
   * @param {{id:string, date:string, time:string, activity:string, status:string, note:string}} routine
   */
  async updateRoutine(routine) {
    const result = await Api._post({
      action: "update",
      ...routine,
    });

    // 1. ส่งแจ้งเตือน Discord
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

    // 2. ส่งแจ้งเตือน LINE
    const lineMsg = `✏️ อัปเดตรายการกิจวัตร!\n📅 วันที่: ${routine.date || '-'}\n⏰ เวลา: ${routine.time || '-'}\n📝 กิจกรรม: ${routine.activity || '-'}\n🏷️ สถานะ: ${routine.status || '-'}`;
    await Api.sendLineNotification(lineMsg);

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

    // 1. ส่งแจ้งเตือน Discord
    await Api.sendDiscordNotification({
      title: "🗑️ ลบรายการกิจวัตรแล้ว",
      color: 15158332, // สีแดง
      fields: [{ name: "🆔 ID รายการ", value: String(id), inline: true }],
    });

    // 2. ส่งแจ้งเตือน LINE
    await Api.sendLineNotification(`🗑️ ลบรายการกิจวัตร (ID: ${id}) เรียบร้อยแล้ว`);

    return result;
  },

  /**
   * ฟังก์ชันส่งแจ้งเตือนเข้า LINE Messaging API
   */
  async sendLineNotification(messageText) {
    const token = CONFIG.LINE_CHANNEL_ACCESS_TOKEN;
    const userId = CONFIG.LINE_USER_ID;

    if (!token || !userId) return;

    try {
      await fetch('https://corsproxy.io/?' + encodeURIComponent('https://api.line.me/v2/bot/message/push'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: userId,
          messages: [
            {
              type: 'text',
              text: messageText
            }
          ]
        })
      });
      console.log('ส่งแจ้งเตือนเข้า LINE สำเร็จ');
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการส่ง LINE Notification:', error);
    }
  },

  /**
   * ฟังก์ชันส่งแจ้งเตือนเข้า Discord Webhook
   */
  async sendDiscordNotification(embedData) {
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
