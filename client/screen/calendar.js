import { waitForAuth } from "../src/services/auth.js";
import { getUserEvents } from "../src/services/calendar.js";
import { getGroupInfo } from "../src/services/group.js";

let currentDate = new Date();

export async function runTest(title, callback) {
  try {
    const result = await callback();
    if (typeof printResult === "function") {
      printResult(title, result);
    }
    return result;
  } catch (error) {
    const errorResult = {
      success: false,
      message: error.message,
      stack: error.stack,
    };
    if (typeof printResult === "function") {
      printResult(title + " - 예외 발생", errorResult);
    }
    return errorResult;
  }
}

//클릭 시 보라색 배경 나타나는 로직
function toggle_click() {
  document.addEventListener("click", async (e) => {
    const targetGroup = e.target.closest(".render_group");

    if (!targetGroup) return;

    console.log("그룹 클릭 확인!", targetGroup);

    targetGroup.classList.toggle("active");

    const selectedGroups = document.querySelectorAll(".render_group.active");

    const groupIds = Array.from(selectedGroups).map(
      (group) => group.dataset.groupId,
    );
    console.log("선택된 그룹 목록:", groupIds);
  });
}
toggle_click();

export async function getMyEvent() {
  await waitForAuth();
  const result = await getUserEvents();

  if (result.success) {
    const events = result.data.map((event) => ({
      ...event,
      startAt: new Date(event.startAt.seconds * 1000),
      endAt: new Date(event.endAt.seconds * 1000),
    }));

    const eventsByDate = {};

    for (const event of events) {
      const date = event.startAt;

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      const dateKey = `${year}-${month}-${day}`;
      const get_group_info = await getGroupInfo(event.groupId);
      console.log("가져온 것 : ", get_group_info);
      const group_color = get_group_info.data.color;
      const startTime = event.startAt;
      const endTime = event.endAt;

      const formatTime = (date) => {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${hours}:${minutes}`;
      };

      const formattedStart = formatTime(startTime);
      const formattedEnd = formatTime(endTime);

      // 해당 날짜가 아직 없다면 새로 생성
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = {
          date: dateKey,
          color: group_color,
          schedule: [],
        };
      }

      // 해당 날짜에 일정 추가
      eventsByDate[dateKey].schedule.push({
        startTime: formattedStart,
        endTime: formattedEnd,
        info: event.title,
      });
    }

    const calendarData = Object.values(eventsByDate);

    console.log("날짜별로 묶인 일정:", calendarData);
    renderSchedule(calendarData);
    console.log(JSON.stringify(calendarData, null, 2));
  }
}
getMyEvent();

let temp_selected = document.getElementById("select_date");
console.log(temp_selected.innerHTML);

if (!temp_selected.innerHTML) {
  temp_selected.innerHTML = "날짜를 선택해주세요";
  temp_selected.style.fontSize = "20px";
}

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
          eventEl.style.backgroundColor = data.color;
          eventEl.style.color = Choose_color(data.color);
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
  let render_schedule = {};
  console.log("arr : ", arr);
  for (let data of arr) {
    if (data.date === dateKey) {
      for (let info_time of data.schedule) {
        let render_time = `${info_time.startTime}~${info_time.endTime}`;
        if (!render_schedule[render_time]) {
          render_schedule[render_time] = [];
        }
        render_schedule[render_time].push(`${info_time.info}, ${data.color}`);
      }
    }
  }

  console.log("render_schedule", render_schedule);

  const container = document.getElementById("sidebar_schedule");
  if (!container) return;

  container.innerHTML = ""; // 기존 목록 초기화

  // 해당 날짜에 일정이 없는 경우 처리
  if (Object.keys(render_schedule).length === 0) {
    container.innerHTML = "<div class='no_schedule'>일정이 없습니다.</div>";
    return;
  }

  // 3. 시간대별로 순회하며 이미지 형태의 HTML 생성[cite: 3]
  for (let [time, infoList] of Object.entries(render_schedule)) {
    let temp_info = infoList.toString().split(",");
    console.log("infoList : ", infoList);
    let card_temp = "";
    infoList.forEach((infoText) => {
      card_temp += `
      <div class="schedule_card" style="background-color: ${temp_info[1]}; color: ${Choose_color(temp_info[0])}">
        ${temp_info[0]}
      </div>
    `;
    });

    // 2. 그룹 전체(시간 + 카드들)를 하나의 HTML 문자열로 만듦
    let group_str = `
    <div class="schedule_group">
      <div class="time_title">${time}</div>
      ${card_temp}
    </div>
  `;

    // 3. 덮어씌우기(=)가 아니라 누적(+=)으로 container에 추가!
    container.innerHTML += group_str;
  }
}

//선택한 날짜부터 전하는 함수
function render_date(date) {
  let temp_date = date.split("-");
  let month = temp_date[1];
  let day = temp_date[2];
  console.log(temp_date);
  document.getElementById("select_date").innerHTML = `${month}월 ${day}일`;
}
