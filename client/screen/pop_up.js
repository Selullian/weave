import { logOut } from "../src/services/auth.js";
import { createGroup, getUserGroups } from "../src/services/group.js";
import { createEvent } from "../src/services/calendar.js";
import { getMyEvent } from "./calendar_screen.js";

let color_popup = `
<div class="group_color_popup">
    <div class="popup_title">
        <small>표지 색상 변경</small>
        <p>(Hex 형식)</p>
    </div>
    <input type="text" class="color_input" />
    <div class="buttons">
        <div class="small_btn" id="cancel_btn">취소</div>
        <div class="small_btn" id="save_btn">확인</div>
    </div>
</div>
`;

let logout_popup = `
<div class="group_buttons">
    <div class="popup_btn" id="logout_btn">로그아웃</div>
    <div class="popup_btn" id="logout_cancel_btn">취소</div>
</div>
`;

let import_popup = `
<div id="import_popup">
    <div id="title_btn">
        <p>.ics 파일 불러오기</p>
        <img src="../assets/X_btn.png" id="X_btn"/>
    </div>
    <div id="upload_btn">
        <img src="../assets/Upload.png"/>
    </div>
</div>
`;

let create_group_popup = `
<div id="create_group_popup" class="group_color_popup">
    <div class="input_group">
      <label for="createName">그룹 이름</label>
      <input type="text" id="createName" placeholder="그룹 이름을 입력하세요" />
    </div>

    <div class="input_group">
      <label for="createDescription">그룹 설명</label>
      <input id="createDescription" placeholder="그룹 설명을 입력하세요" />
    </div>

    <div class="input_group">
      <label for="createColor">배경색</label>
      <input type="text" id="createColor" placeholder="Hex로 입력하세요 예) #FFFFFF"/>
    </div>

    <div class="popup_buttons">
      <button type="button" id="cancel_create_btn" class="cancel_btn">취소</button>
      <button type="submit" id="submit_btn">생성</button>
    </div>
</div>`;

let add_schedule_popup = `
<div id="add_schedule_popup" class="schedules_popup">
    <div class="popup_header">
        <span class="back_btn" id="schedule_back_btn">&lt;</span>
        <h2>일정 추가</h2>
    </div>
    <select id="scheduleGroup">
      <option value="groupId1">첫 번째 그룹</option>
    </select>
    <div class="input_schedule">
        <label for="scheduleTitle">일정명</label>
        <input type="text" id="scheduleTitle" class="popup_input" />
    </div>
    <div class="input_schedule">
        <label for="scheduleDate">날짜</label>
        <div id="input_date">
        <input type="datetime-local" id="startDate" class="schedule_input" />
        ~
        <input type="datetime-local" id="endDate" class="schedule_input" />
        </div>
    </div>
    <div class="input_schedule">
        <label for="scheduleMemo">메모</label>
        <textarea id="scheduleMemo" class="popup_textarea"></textarea>
    </div>
    <div class="toggle_group">
        <span>공개 여부</span>
        <label class="switch">
            <input type="checkbox" id="scheduleIsPublic" checked />
            <span class="slider round"></span>
        </label>
    </div>
    <div class="popup_buttons">
        <button type="button" id="cancel_schedule_btn" class="btn_cancel">취소</button>
        <button type="button" id="submit_schedule_btn" class="btn_submit">확인</button>
    </div>
</div>
`;

document.addEventListener("click", async (e) => {
  const logout_btn = e.target.closest("#logout_btn");
  if (logout_btn) {
    console.log(logout_btn);
    try {
      await logOut(); // await 추가!
      alert("로그아웃이 성공하였습니다.");
      location.href = "./sign_in.html";
    } catch (e) {
      console.error(e);
      alert("로그아웃 실패");
    }
  }

  const createGroups = e.target.closest("#submit_btn");
  if (createGroups) {
    console.log(createGroups);
    e.preventDefault();

    const name = document.getElementById("createName").value.trim();

    const description = document
      .getElementById("createDescription")
      .value.trim();

    const color = document.getElementById("createColor").value;

    const res = await runTest("그룹 생성", () =>
      createGroup({
        name,
        description,
        color,
      }),
    );

    if (res && res.success !== false) {
      alert("그룹이 생성되었습니다!");

      const popup = document.querySelector("#create_group_popup");
      if (popup) popup.classList.remove("active");

      if (typeof window.renderGroup === "function") {
        await window.renderGroup();
      } else {
        console.error("❌ window.renderGroup 함수를 찾을 수 없습니다.");
      }
    }
  }

  const submitScheduleBtn = e.target.closest("#submit_schedule_btn");
  if (submitScheduleBtn) {
    e.preventDefault();
    const groupId = document.getElementById("scheduleGroup").value;
    const title = document.getElementById("scheduleTitle").value.trim();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const memo = document.getElementById("scheduleMemo").value.trim();
    const isPublic = document.getElementById("scheduleIsPublic").checked;

    if (!title) return alert("일정명을 입력해 주세요.");
    if (!startDate || !endDate) return alert("날짜들을 입력해주세요");

    console.log("입력 데이터:", { title, memo, isPublic });
    const startAt = new Date(startDate);
    const endAt = new Date(endDate);

    if (
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime()) ||
      endAt <= startAt
    ) {
      showResult("일정 생성", {
        message: "종료 일시는 시작 일시보다 늦어야 합니다.",
      });
      return;
    }

    const contents = {
      title,
      startAt,
      endAt,
      memo,
      isPublic,
      source: "manual",
      ...(groupId ? { groupId } : {}),
    };
    await runTest("일정 생성", () =>
      createEvent(
        contents.title,
        contents.startAt,
        contents.endAt,
        contents.memo,
        contents.isPublic,
        contents.source,
        contents.groupId,
      ),
    );
    console.log("일정 생성 완료");
    getMyEvent();
  }

  // 1. [취소 버튼 클릭 처리]
  const cancelBtn = e.target.closest("#cancel_btn");
  if (cancelBtn) {
    const activePopup = cancelBtn.closest(".group_color_popup");
    if (activePopup) {
      activePopup.classList.remove("active");
    }
    return;
  }

  const x_btn = e.target.closest("#X_btn");
  if (x_btn) {
    const importPopup = x_btn.closest("#import_popup");
    if (importPopup) {
      importPopup.classList.remove("active");
    }
  }

  const closeScheduleBtn = e.target.closest(
    "#schedule_back_btn, #cancel_schedule_btn",
  );
  if (closeScheduleBtn) {
    closeScheduleBtn.closest("#add_schedule_popup")?.classList.remove("active");
    return;
  }

  const cancel_btn = e.target.closest("#cancel_create_btn");
  if (cancel_btn) {
    const createPopup = cancel_btn.closest("#create_group_popup");
    if (createPopup) {
      createPopup.classList.remove("active");
    }
  }

  // 2. [팝업 내부 클릭 시 아무 동작 안 함] (input 입력 등 클릭 시 닫힘 방지)
  if (
    e.target.closest(".group_color_popup") ||
    e.target.closest(".group_buttons") ||
    e.target.closest("#import_popup")
  ) {
    return;
  }

  //그룹 배경색 다르게하는 팝업 처리
  const titleBtn = e.target.closest(".title_more_img");
  if (titleBtn) {
    let popup = titleBtn.querySelector(".group_color_popup");
    if (!popup) {
      titleBtn.insertAdjacentHTML("beforeend", color_popup);
      popup = titleBtn.querySelector(".group_color_popup");

      let newInputs = popup.getElementsByClassName("color_input");
      for (let i = 0; i < newInputs.length; i++) {
        newInputs[i].value = "#";
      }
    }
    if (popup) {
      popup.classList.toggle("active");
    }
    return;
  }

  //로그아웃 및 취소 버튼 처리
  const userBtn = e.target.closest("#user_more_img");
  if (userBtn) {
    let morePopup = userBtn.querySelector(".group_buttons");
    if (!morePopup) {
      userBtn.insertAdjacentHTML("beforeend", logout_popup);
      morePopup = userBtn.querySelector(".group_buttons");
    }
    if (morePopup) {
      morePopup.classList.toggle("active");
    }
    return;
  }

  //일정 추가 버튼 처리
  const uploadBtn = e.target.closest("#upload_button");
  if (uploadBtn) {
    let importBtn = uploadBtn.querySelector("#import_popup");
    if (!importBtn) {
      uploadBtn.insertAdjacentHTML("beforeend", import_popup);
      importBtn = uploadBtn.querySelector("#import_popup");
    }
    if (importBtn) {
      importBtn.classList.toggle("active");
    }
    return;
  }

  //그룹 추가 버튼 처리
  const createGroupBtn = e.target.closest("#add_btn");
  if (createGroupBtn) {
    let create_group = createGroupBtn.querySelector("#create_group_popup");

    if (!create_group) {
      createGroupBtn.insertAdjacentHTML("beforeend", create_group_popup);
      create_group = createGroupBtn.querySelector("#create_group_popup");
    }

    if (create_group) {
      create_group.classList.toggle("active");
    }
  }

  //일정 추가 버튼 처리
  const scheduleAddBtn = e.target.closest("#plusBtn");
  if (scheduleAddBtn) {
    let popup = document.querySelector("#add_schedule_popup");
    if (!popup) {
      const sidebar = document.getElementById("right_sidebar");

      if (!sidebar) {
        console.error("right_sidebar를 찾을 수 없습니다.");
        return;
      }

      sidebar.insertAdjacentHTML("beforeend", add_schedule_popup);

      popup = document.querySelector("#add_schedule_popup");
    }

    if (popup) {
      popup.classList.add("active");

      await renderOptionGroups();
    }

    return;
  }
});

import { waitForAuth } from "../src/services/auth.js";

async function renderOptionGroups() {
  try {
    await waitForAuth();
    const res = await getUserGroups();
    if (!res || res.success === false) {
      console.error("그룹 데이터 조회 실패");
      return;
    }
    const optionContainer = document.getElementById("scheduleGroup");
    if (!optionContainer) {
      console.error("scheduleGroup 요소가 없습니다.");
      return;
    }
    optionContainer.innerHTML = `<option value="">그룹을 선택하세요</option>`;
    if (!res.data || res.data.length === 0) {
      console.log("등록된 그룹이 없습니다.");
      return;
    }
    res.data.forEach((group) => {
      console.log("추가할 그룹:", group);

      const option = document.createElement("option");
      option.value = group.groupId;
      option.textContent = group.name;

      optionContainer.appendChild(option);
    });
  } catch (e) {
    console.error("그룹 옵션 렌더링 오류:", e);
  }
}
renderOptionGroups();
