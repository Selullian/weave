import { waitForAuth } from "../src/services/auth.js";
import { getUserEvents, getGroupEvents } from "../src/services/calendar.js";
import { getGroupInfo } from "../src/services/group.js";

let currentDate = new Date();
let eventsData = [];

//클릭 시 보라색 배경 나타나는 로직
// 그룹 클릭 시 선택된 그룹의 일정 가져오기
function toggle_click() {
  document.addEventListener("click", async (e) => {
    const targetGroup = e.target.closest(".render_group");

    if (!targetGroup) return;

    // 다른 그룹의 활성화 상태 모두 제거
    document.querySelectorAll(".render_group.active").forEach((group) => {
      group.classList.remove("active");
    });

    // 클릭한 그룹만 활성화
    targetGroup.classList.add("active");

    // 선택된 그룹 ID 가져오기
    const groupIds = [targetGroup.dataset.groupId];

    console.log("현재 선택된 그룹:", groupIds);

    // 선택된 그룹의 일정 불러오기
    await getMyEvent(groupIds);
    await renderGroupInfo(groupIds[0]);
  });
}

async function renderGroupInfo(groupId) {
  const result = await getGroupInfo(groupId);

  if (!result.success || !result.data) {
    console.error("그룹 정보 조회 실패:", result);
    return;
  }

  const groupName = document.getElementById("group_name");
  const groupInfo = document.getElementById("group_info");

  groupName.textContent = result.data.name;
  groupInfo.textContent = result.data.description;
}
// Firestore Timestamp 또는 Date를 JavaScript Date로 변환
function convertDate(value) {
  if (value instanceof Date) return value;

  if (value && typeof value.toDate === "function") {
    return value.toDate();
  }

  if (value && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  return new Date(value);
}

// 개인 일정 + 선택한 그룹 일정 가져오기
export async function getMyEvent(selectedGroupIds = []) {
  await waitForAuth();

  try {
    // 1. 개인 일정 가져오기
    const userResult = await getUserEvents();

    if (!userResult.success) {
      console.error("개인 일정 조회 실패:", userResult);
      return;
    }

    let allEvents = [...(userResult.data ?? [])];

    console.table(
      allEvents.map((event, index) => ({
        index,
        title: event.title,
        groupId: event.groupId,
        eventId: event.eventId,
        source: event.source,
        userId: event.userId,
      })),
    );

    // 2. 선택한 그룹들의 일정 가져오기
    const groupResults = await Promise.all(
      selectedGroupIds.map((groupId) => getGroupEvents(groupId)),
    );

    console.log("개인 일정 원본:", userResult.data);

    console.log(
      "그룹 일정 원본:",
      groupResults.map((result) => result.data),
    );

    for (const result of groupResults) {
      if (!result.success) {
        console.error("그룹 일정 조회 실패:", result);
        continue;
      }

      allEvents.push(...(result.data ?? []));
    }

    console.log("개인 일정:", userResult.data);
    console.log("그룹 일정:", groupResults);
    console.log("합쳐진 전체 일정:", allEvents);

    // 3. 선택된 그룹들의 색상 가져오기
    const groupColors = {};

    const groupInfoResults = await Promise.all(
      selectedGroupIds.map((groupId) => getGroupInfo(groupId)),
    );

    selectedGroupIds.forEach((groupId, index) => {
      const info = groupInfoResults[index];

      if (info?.success && info.data) {
        groupColors[groupId] = info.data.color;
      }
    });

    // 4. 날짜별로 일정 묶기
    const eventsByDate = {};

    for (const event of allEvents) {
      const startAt = convertDate(event.startAt);
      const endAt = convertDate(event.endAt);

      if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
        console.warn("날짜가 올바르지 않은 일정:", event);
        continue;
      }

      const year = startAt.getFullYear();
      const month = String(startAt.getMonth() + 1).padStart(2, "0");
      const day = String(startAt.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;

      const formatTime = (date) => {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      };

      const eventColor = groupColors[event.groupId] || event.color || "#808080";

      // 날짜별 객체가 없으면 먼저 생성
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = {
          date: dateKey,
          schedule: [],
        };
      }

      // 일정 추가
      eventsByDate[dateKey].schedule.push({
        eventId: event.id,
        startTime: formatTime(startAt),
        endTime: formatTime(endAt),
        info: event.title,
        color: eventColor,
        originalEvent: event,
      });
    }
    // 5. 달력에 사용할 데이터 저장
    eventsData = Object.values(eventsByDate);

    console.log("최종 캘린더 데이터:", eventsData);
    console.log("날짜별 최종 일정:", eventsByDate);

    renderSchedule(eventsData);
  } catch (e) {
    console.error("일정 렌더링 실패:", e);
  }
}

// 최초 실행: 개인 일정만 표시
getMyEvent([]);
toggle_click();

let renderSchedule = (arr) => {
  let month_name = [
    "January",
    "Febuary",
    "March",
    "April",
    "May",
    "June",
    "July",
    "Auguest",
    "September",
    "October",
    "November",
    "December",
  ];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0: 1월, 11: 12월

  // 1. 헤더 연/월 표시
  document.getElementById("month").innerHTML = month_name[month];
  document.getElementById("year").innerHTML = year;

  const grid = document.getElementById("calendarGrid");
  if (!grid) return;
  grid.innerHTML = ""; // 기존 그리드 초기화

  const eventsMap = {};

  console.log(eventsMap);

  // 3. 요일 헤더 생성 ("일" ~ "토")
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  days.forEach((day) => {
    const dayNameEl = document.createElement("div");
    dayNameEl.className = "day_name";
    dayNameEl.innerHTML = day;
    grid.appendChild(dayNameEl);
  });

  // 4. 날짜 계산 (1일의 요일 인덱스 & 해당 월의 마지막 날짜)
  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  // 5. 이전 달 빈 칸(Offset) 셀 추가
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day_cell empty";
    grid.appendChild(emptyCell);
  }

  // 6. 이번 달 날짜 셀 및 일정 생성
  for (let day = 1; day <= lastDate; day++) {
    const cell = document.createElement("div");
    cell.className = "day_cell";

    // 날짜 숫자 표시
    const dayNum = document.createElement("div");
    dayNum.className = "day_number";
    dayNum.textContent = day;
    cell.appendChild(dayNum);

    // 비교용 날짜 키 생성 (YYYY-MM-DD)
    const formattedMonth = String(month + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const dateKey = `${year}-${formattedMonth}-${formattedDay}`;

    for (let data of arr) {
      if (data.date === dateKey) {
        for (let temp_str of data.schedule) {
          const eventEl = document.createElement("div");

          eventEl.className = "event_tag";
          eventEl.textContent = temp_str.info;
          eventEl.style.backgroundColor = temp_str.color;
          eventEl.style.color = Choose_color(temp_str.color);

          // 일정 클릭 이벤트
          eventEl.addEventListener("click", (e) => {
            e.stopPropagation();

            const selectedEvent = temp_str.originalEvent;

            renderEventDetail(selectedEvent);
          });

          cell.appendChild(eventEl);
        }
      }
    }

    cell.onclick = () => {
      render_date(dateKey);
      console.log("클릭 확인!");
      render_sidebar_schedule(arr, dateKey);
    };
    grid.appendChild(cell);
  }
};

// 이전/다음 달 이동 버튼 이벤트
document.getElementById("prevBtn").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderSchedule(eventsData);
};

document.getElementById("nextBtn").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderSchedule(eventsData);
};

export function Choose_color(hexColor) {
  let temp_hex = hexColor.replace("#", "");
  if (hexColor === "white") {
    temp_hex = "FFFFFF";
  }
  let r = parseInt(temp_hex.substring(0, 2), 16);
  let g = parseInt(temp_hex.substring(2, 4), 16);
  let b = parseInt(temp_hex.substring(4, 6), 16);

  let bright = (r * 299 + g * 587 + b * 114) / 1000;

  if (bright >= 128) {
    return "black";
  } else {
    return "white";
  }
}

//사이드바에 일정 업로드
function render_sidebar_schedule(arr, dateKey) {
  const container = document.getElementById("sidebar_schedule");

  if (!container) return;

  container.innerHTML = "";

  const selectedDate = arr.find((data) => data.date === dateKey);

  if (!selectedDate || selectedDate.schedule.length === 0) {
    container.innerHTML = "<div class='no_schedule'>일정이 없습니다.</div>";
    return;
  }

  const render_schedule = {};

  for (const event of selectedDate.schedule) {
    const render_time = `${event.startTime}~${event.endTime}`;

    if (!render_schedule[render_time]) {
      render_schedule[render_time] = [];
    }

    render_schedule[render_time].push(event);
  }

  for (const [time, infoList] of Object.entries(render_schedule)) {
    let card_temp = "";

    infoList.forEach((event) => {
      card_temp += `
        <div
          class="schedule_card"
          style="
            background-color: ${event.color};
            color: ${Choose_color(event.color)};
          "
        >
          ${event.info}
        </div>
      `;
    });

    container.insertAdjacentHTML(
      "beforeend",
      `
        <div class="schedule_group">
          <div class="time_title">${time}</div>
          ${card_temp}
        </div>
      `,
    );
  }
}

async function renderEventDetail(event) {
  const container = document.getElementById("sidebar_content");

  if (!container || !event) return;

  container.replaceChildren();

  // 그룹 정보 가져오기
  const groupResult = await getGroupInfo(event.groupId);
  const groupName = groupResult?.success
    ? groupResult.data?.name || "그룹 정보 없음"
    : "그룹 정보 없음";

  const startAt = convertDate(event.startAt);
  const endAt = convertDate(event.endAt);

  const formatDate = (date) => `${date.getMonth() + 1}월 ${date.getDate()}일`;

  const formatTime = (date) =>
    `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes(),
    ).padStart(2, "0")}`;

  // 상세 정보 영역
  const detail = document.createElement("div");
  detail.id = "event_detail";

  // 그룹 이름
  const group = document.createElement("p");
  group.className = "detail_group_name";
  group.textContent = groupName;

  // 일정 제목
  const title = document.createElement("p");
  title.className = "detail_title";
  title.textContent = event.title;

  // 날짜
  const date = document.createElement("p");
  date.className = "detail_date";
  date.textContent =
    formatDate(startAt) === formatDate(endAt)
      ? formatDate(startAt)
      : `${formatDate(startAt)} ~ ${formatDate(endAt)}`;

  // 시간
  const time = document.createElement("p");
  time.className = "detail_time";
  time.textContent = `${formatTime(startAt)} ~ ${formatTime(endAt)}`;

  // 메모
  const memoLabel = document.createElement("p");
  memoLabel.className = "detail_memo_label";
  memoLabel.textContent = "메모";

  const memo = document.createElement("textarea");
  memo.className = "detail_memo";
  memo.value = event.memo || "";
  memo.readOnly = true;
  memo.placeholder = "일정 메모";

  // 하단 영역
  const bottom = document.createElement("div");
  bottom.className = "detail_bottom";

  const publicText = document.createElement("p");
  publicText.className = "detail_public";
  publicText.textContent = event.isPublic ? "공개" : "비공개";

  const editButton = document.createElement("button");
  editButton.id = "edit_event_button";
  editButton.textContent = "수정";

  bottom.append(publicText, editButton);

  // 요소 조립
  detail.append(group, title, date, time, memoLabel, memo, bottom);

  container.appendChild(detail);
}

//선택한 날짜부터 전하는 함수
function render_date(date) {
  console.log("선택한 날짜:", date);
}
