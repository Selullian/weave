let currentDate = new Date();

let eventsData = [
  {
    date: "2026-11-15",
    schedule: [{ info: "팀 회의", time: "10:00~12:00" }],
    color: "white",
  },
  {
    date: "2026-11-27",
    schedule: [
      { info: "배포일", time: "12:00~13:00" },
      { info: "회식", time: "17:00~18:30" },
    ],
    color: "#D5FFCE",
  },
];

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
      render_sidebar_schedule(eventsData, dateKey);
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

function Choose_color(hexColor) {
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

  for (let data of arr) {
    if (data.date === dateKey) {
      for (let info_time of data.schedule) {
        if (!render_schedule[info_time.time]) {
          render_schedule[info_time.time] = [];
        }
        render_schedule[info_time.time].push(info_time.info);
      }
    }
  }

  console.log(render_schedule);

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
    // 시간대 그룹 컨테이너
    const groupEl = document.createElement("div");
    groupEl.className = "schedule_group";

    // 시간 제목 (예: 12:00~13:00)
    const timeEl = document.createElement("div");
    timeEl.className = "time_title";
    timeEl.textContent = time;
    groupEl.appendChild(timeEl);

    // 해당 시간대의 일정 카드 목록 생성 (배열 요소마다 둥근 박스 1개씩)
    infoList.forEach((infoText) => {
      const cardEl = document.createElement("div");
      cardEl.className = "schedule_card";
      cardEl.textContent = infoText; // "배포일", "회식" 등
      groupEl.appendChild(cardEl);
    });

    container.appendChild(groupEl);
  }
}
// 초기 실행
renderSchedule(eventsData);

//선택한 날짜부터 전하는 함수
function render_date(date) {
  let temp_date = date.split("-");
  let month = temp_date[1];
  let day = temp_date[2];
  console.log(temp_date);
  document.getElementById("select_date").innerHTML = `${month}월 ${day}일`;
}
