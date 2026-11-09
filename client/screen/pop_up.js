import { logOut } from "../src/services/auth.js";
import { createGroup } from "../src/services/group.js";

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

window.addEventListener("DOMContentLoaded", () => {
  let inputs = document.getElementsByClassName("color_input");
  for (let i = 0; i < inputs.length; i++) {
    inputs[i].value = "#";
  }
});

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

    // 💡 생성 성공 검증 후 렌더링 실행
    if (res && res.success !== false) {
      alert("그룹이 생성되었습니다!");

      // 1. 팝업 닫기
      const popup = document.querySelector("#create_group_popup");
      if (popup) popup.classList.remove("active");

      // 2. 💡 window.renderGroup이 함수인지 확인 후 await로 호출!
      if (typeof window.renderGroup === "function") {
        await window.renderGroup();
      } else {
        console.error("❌ window.renderGroup 함수를 찾을 수 없습니다.");
      }
    }
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

  const cancel_btn = e.target.closest("#cancel_create_btn");
  if (cancel_btn) {
    const createPopup = cancelBtn.closest("#create_group_popup");
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

  // 3. [첫 번째 버튼: .title_more_img 클릭 처리]
  const titleBtn = e.target.closest(".title_more_img");
  if (titleBtn) {
    let popup = titleBtn.querySelector(".group_color_popup");

    // 팝업 없으면 동적 생성
    if (!popup) {
      titleBtn.insertAdjacentHTML("beforeend", color_popup);
      popup = titleBtn.querySelector(".group_color_popup");

      let newInputs = popup.getElementsByClassName("color_input");
      for (let i = 0; i < newInputs.length; i++) {
        newInputs[i].value = "#";
      }
    }

    // 토글
    if (popup) {
      popup.classList.toggle("active");
    }
    return; // 처리 완료 후 종료
  }

  // 4. [두 번째 버튼: #user_more_img 클릭 처리]
  const userBtn = e.target.closest("#user_more_img");
  if (userBtn) {
    let morePopup = userBtn.querySelector(".group_buttons");

    // 팝업 없으면 동적 생성
    if (!morePopup) {
      userBtn.insertAdjacentHTML("beforeend", logout_popup);
      morePopup = userBtn.querySelector(".group_buttons");
    }

    // 토글 (morePopup 변수 사용)
    if (morePopup) {
      morePopup.classList.toggle("active");
    }
    return; // 처리 완료 후 종료
  }

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
});
