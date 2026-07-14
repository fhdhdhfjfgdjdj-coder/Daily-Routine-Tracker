/**
 * app.js
 * -----------------------------------------------------------------------
 * ตรรกะฝั่ง UI ทั้งหมดของ Daily Routine Tracker
 * หน้าที่: render ตาราง, จัดการฟอร์ม (เพิ่ม/แก้ไข), ลบ, กรองตามวันที่,
 * แสดงสถานะการโหลด/ข้อผิดพลาด และคำนวณสรุปตัวเลข
 * -----------------------------------------------------------------------
 */

(() => {
  const state = {
    routines: [],
    filterDate: "",
    editingId: null,
    loading: false,
  };

  // ---------------------------- DOM references ----------------------------
  const el = {
    todayLabel: document.getElementById("todayLabel"),
    statTotal: document.getElementById("statTotal"),
    statDone: document.getElementById("statDone"),
    statPending: document.getElementById("statPending"),

    form: document.getElementById("routineForm"),
    formTitle: document.getElementById("formTitle"),
    formModeTag: document.getElementById("formModeTag"),
    routineId: document.getElementById("routineId"),
    fieldDate: document.getElementById("fieldDate"),
    fieldTime: document.getElementById("fieldTime"),
    fieldActivity: document.getElementById("fieldActivity"),
    fieldStatus: document.getElementById("fieldStatus"),
    fieldNote: document.getElementById("fieldNote"),
    submitBtn: document.getElementById("submitBtn"),
    cancelEditBtn: document.getElementById("cancelEditBtn"),

    filterDate: document.getElementById("filterDate"),
    clearFilterBtn: document.getElementById("clearFilterBtn"),
    refreshBtn: document.getElementById("refreshBtn"),

    statusBanner: document.getElementById("statusBanner"),
    tableBody: document.getElementById("routineTableBody"),
    emptyState: document.getElementById("emptyState"),
    rowTemplate: document.getElementById("rowTemplate"),
  };

  // ---------------------------- Helpers ----------------------------

  function formatThaiDate(date) {
    const days = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
    const months = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
    ];
    const d = new Date(date);
    return `วัน${days[d.getDay()]}ที่ ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  }

  function showBanner(message, type = "info") {
    el.statusBanner.textContent = message;
    el.statusBanner.className = `status-banner ${type}`;
    el.statusBanner.hidden = false;
  }

  function hideBanner() {
    el.statusBanner.hidden = true;
  }

  function setLoading(isLoading) {
    state.loading = isLoading;
    el.refreshBtn.disabled = isLoading;
    el.submitBtn.disabled = isLoading;
    el.submitBtn.textContent = isLoading
      ? "กำลังบันทึก..."
      : state.editingId
      ? "บันทึกการแก้ไข"
      : "บันทึกกิจวัตร";
  }

  function resetForm() {
    state.editingId = null;
    el.form.reset();
    el.routineId.value = "";
    el.formTitle.textContent = "เพิ่มกิจวัตรใหม่";
    el.formModeTag.textContent = "NEW";
    el.formModeTag.classList.remove("editing");
    el.cancelEditBtn.hidden = true;
    el.submitBtn.textContent = "บันทึกกิจวัตร";
    el.fieldDate.value = todayIso();
  }

  function todayIso() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 10);
  }

  // ---------------------------- Rendering ----------------------------

  function renderStats(list) {
    const total = list.length;
    const done = list.filter((r) => r.status === "ทำแล้ว").length;
    el.statTotal.textContent = total;
    el.statDone.textContent = done;
    el.statPending.textContent = total - done;
  }

  function renderTable() {
    const list = state.routines
      .filter((r) => (state.filterDate ? r.date === state.filterDate : true))
      .slice()
      .sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return a.time < b.time ? 1 : -1;
      });

    renderStats(state.routines);

    el.tableBody.innerHTML = "";

    if (list.length === 0) {
      el.emptyState.hidden = false;
      return;
    }
    el.emptyState.hidden = true;

    for (const routine of list) {
      const row = el.rowTemplate.content.firstElementChild.cloneNode(true);

      const dateCell = row.querySelector('[data-cell="date"]');
      const timeCell = row.querySelector('[data-cell="time"]');
      const activityCell = row.querySelector('[data-cell="activity"]');
      const statusCell = row.querySelector('[data-cell="status"]');
      const noteCell = row.querySelector('[data-cell="note"]');

      dateCell.textContent = routine.date;
      dateCell.setAttribute("data-label", "วันที่");

      timeCell.textContent = routine.time;
      timeCell.setAttribute("data-label", "เวลา");

      activityCell.textContent = routine.activity;
      activityCell.setAttribute("data-label", "กิจกรรม");

      const isDone = routine.status === "ทำแล้ว";
      const stamp = document.createElement("span");
      stamp.className = `status-stamp ${isDone ? "done" : "pending"}`;
      stamp.textContent = isDone ? "ทำแล้ว" : "ยังไม่ทำ";
      statusCell.appendChild(stamp);
      statusCell.setAttribute("data-label", "สถานะ");

      noteCell.textContent = routine.note || "-";
      noteCell.setAttribute("data-label", "หมายเหตุ");

      row.querySelector(".edit-btn").addEventListener("click", () => startEdit(routine));
      row.querySelector(".delete-btn").addEventListener("click", () => confirmDelete(routine));

      el.tableBody.appendChild(row);
    }
  }

  // ---------------------------- Data loading ----------------------------

  async function loadRoutines() {
    setLoading(true);
    hideBanner();
    try {
      const data = await Api.getRoutines();
      state.routines = data;
      renderTable();
    } catch (err) {
      showBanner(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------- Form handling ----------------------------

  function startEdit(routine) {
    state.editingId = routine.id;
    el.routineId.value = routine.id;
    el.fieldDate.value = routine.date;
    el.fieldTime.value = routine.time;
    el.fieldActivity.value = routine.activity;
    el.fieldStatus.value = routine.status;
    el.fieldNote.value = routine.note || "";

    el.formTitle.textContent = "แก้ไขกิจวัตร";
    el.formModeTag.textContent = "EDIT";
    el.formModeTag.classList.add("editing");
    el.cancelEditBtn.hidden = false;
    el.submitBtn.textContent = "บันทึกการแก้ไข";

    el.form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function confirmDelete(routine) {
    const ok = window.confirm(
      `ต้องการลบกิจวัตร "${routine.activity}" (${routine.date} ${routine.time}) ใช่หรือไม่?`
    );
    if (!ok) return;

    setLoading(true);
    hideBanner();
    try {
      await Api.deleteRoutine(routine.id);
      state.routines = state.routines.filter((r) => r.id !== routine.id);
      renderTable();
      showBanner("ลบกิจวัตรเรียบร้อยแล้ว", "success");
      if (state.editingId === routine.id) resetForm();
    } catch (err) {
      showBanner(`ลบไม่สำเร็จ: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    hideBanner();

    const payload = {
      date: el.fieldDate.value,
      time: el.fieldTime.value,
      activity: el.fieldActivity.value.trim(),
      status: el.fieldStatus.value,
      note: el.fieldNote.value.trim(),
    };

    if (!payload.date || !payload.time || !payload.activity) {
      showBanner("กรุณากรอกวันที่ เวลา และชื่อกิจกรรมให้ครบถ้วน", "error");
      return;
    }

    setLoading(true);
    try {
      if (state.editingId) {
        const updated = await Api.updateRoutine({ id: state.editingId, ...payload });
        const idx = state.routines.findIndex((r) => r.id === state.editingId);
        if (idx !== -1) state.routines[idx] = updated;
        showBanner("แก้ไขกิจวัตรเรียบร้อยแล้ว", "success");
      } else {
        const created = await Api.addRoutine(payload);
        state.routines.push(created);
        showBanner("เพิ่มกิจวัตรเรียบร้อยแล้ว", "success");
      }
      resetForm();
      renderTable();
    } catch (err) {
      showBanner(`บันทึกไม่สำเร็จ: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------- Filter handling ----------------------------

  function handleFilterChange() {
    state.filterDate = el.filterDate.value;
    renderTable();
  }

  function clearFilter() {
    el.filterDate.value = "";
    state.filterDate = "";
    renderTable();
  }

  // ---------------------------- Init ----------------------------

  function init() {
    el.todayLabel.textContent = formatThaiDate(new Date());
    el.fieldDate.value = todayIso();

    el.form.addEventListener("submit", handleSubmit);
    el.cancelEditBtn.addEventListener("click", resetForm);
    el.filterDate.addEventListener("change", handleFilterChange);
    el.clearFilterBtn.addEventListener("click", clearFilter);
    el.refreshBtn.addEventListener("click", loadRoutines);

    loadRoutines();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
