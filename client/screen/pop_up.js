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
        <img src="../assets/X_btn.png"/>
    </div>
    <div id="upload_btn">
        <img src="../assets/Upload.png"/>
    </div>
</div>
`;

window.addEventListener("DOMContentLoaded", () => {
  let inputs = document.getElementsByClassName("color_input");
  for (let i = 0; i < inputs.length; i++) {
    inputs[i].value = "#";
  }
});

document.addEventListener("click", (e) => {
  // 1. [취소 버튼 클릭 처리]
  const cancelBtn = e.target.closest("#cancel_btn");
  if (cancelBtn) {
    const activePopup = cancelBtn.closest(".group_color_popup");
    if (activePopup) {
      activePopup.classList.remove("active");
    }
    return;
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
});
