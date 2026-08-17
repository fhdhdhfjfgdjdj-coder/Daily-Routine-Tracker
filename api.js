/**
 * api.js (Local Mock Version)
 * -----------------------------------------------------------------------
 * ระบบจำลองการจัดการข้อมูลชั่วคราว (ไม่ผ่าน Google Apps Script)
 * แต่ยังคงส่งการแจ้งเตือนไปยัง Discord Webhook และ LINE Messaging API ตามปกติ
 * -----------------------------------------------------------------------
 */

// สร้างหน่วยความจำจำลองข้อมูลชั่วคราวไว้ในเครื่อง
let localRoutines = [];

const Api = {
  /**
   * ดึงรายการกิจวัตรทั้งหมด (จำลองข้อมูล)
   * @returns {Promise<Array>} รายการกิจวัตร
   */
  async getRoutines() {
    // ส่งคืนข้อมูลจำลองในเครื่อง
    return Promise.resolve(localRoutines);
  },

  /**
   * เพิ่มกิจวัตรใหม่
   * @param {{date:string, time:string, activity:string, status:string, note:string}} routine
   */
  async addRoutine(routine) {
    const newRoutine = {
      id: String(Date.now()), // สุ่ม ID จากเวลาปัจจุบัน
      ...routine,
    };
    localRoutines.push(newRoutine);

    // 1. ส่งแจ้งเตือน Discord
    await Api.sendDiscordNotification({
      title: "📌 บันทึกกิจวัตรใหม่สำเร็จ!",
      color: 3447003, // สีฟ้า (Hex: #3498DB)
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

    return newRoutine;
  },

  /**
   * แก้ไขกิจวัตรที่มีอยู่
   * @param {{id:string, date:string, time:string, activity:string, status:string, note:string}} routine
   */
  async updateRoutine(routine) {
    const index = localRoutines.findIndex((r) => r.id === routine.id);
    if (index !== -1) {
      localRoutines[index] = { ...localRoutines[index], ...routine };
    }

    // เช็กสถานะเพื่อเลือกสีแถบ
    const isDone = routine.status === "ทำแล้ว";
    const embedColor = isDone ? 3066993 : 16753920;

    // 1. ส่งแจ้งเตือน Discord
    await Api.sendDiscordNotification({
      title: "✏️ อัปเดตรายการกิจวัตร!",
      color: embedColor,
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

    return routine;
  },

  /**
   * ลบกิจวัตรตาม id
   * @param {string} id
   */
  async deleteRoutine(id) {
    localRoutines = localRoutines.filter((r) => r.id !== id);

    // 1. ส่งแจ้งเตือน Discord
    await Api.sendDiscordNotification({
      title: "🗑️ ลบรายการกิจวัตรแล้ว",
      color: 15158332, // สีแดง
      fields: [{ name: "🆔 ID รายการ", value: String(id), inline: true }],
    });

    // 2. ส่งแจ้งเตือน LINE
    await Api.sendLineNotification(`🗑️ ลบรายการกิจวัตร (ID: ${id}) เรียบร้อยแล้ว`);

    return true;
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
  }
};
