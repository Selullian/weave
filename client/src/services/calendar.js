//calendar.js
import { getUserGroupIds } from "../services/auth.js";
import { ok, fail, requiredUid, getToUpdateContent } from "./common.js";
import {
  createEventDoc,
  getUserEventDocs,
  getUserPublicEventDocs,
  getGroupEventDocs,
  updateEventDoc,
  findEventDoc,
  deleteEventDoc,
  isExistEvent,
  getEventDocById,
  getMonthEventDocs,
} from "../repository/calendar_repository.js";

/*
========================
일정 관리
------------------------
1. 일정 생성
   - createEvent(title, startAt, endAt, memo, isPublic, source, groupId)
2. 단일 일정 조회
   - getEventById(eventId)
3. 사용자 전체 일정 조회
   - getUserEvents()
4. 사용자 공개 일정 조회
   - getUserPublicEvents()
5. 그룹 일정 조회
   - getGroupEvents(groupId)
6. 일정 수정
   - updateEvent(eventId, contents)
7. 일정 검색
   - findEventByTitle(title)
8. 일정 삭제
   - deleteEvent(eventId)
9. ics 파일을 통한 일정 가져오기
10. 일정 소유자 확인
========================
*/

/**
 * timestamp를 date 객체로 변환한다.
 *
 * @param {Object} date - 변환할 timestamp 객체
 * @returns {Date|undefined} 변환된 date 객체
 */
function toDate(date) {
  if (date.seconds) return new Date(date.seconds * 1000);
}

/**
 * 일정 생성
 *
 * 필수 입력값과 일정 출처를 검증한 후
 * 현재 로그인한 사용자를 소유자로 지정하여 새로운 일정을 생성한다.
 *
 * @param {string} title - 일정 제목
 * @param {Date|Object} startAt - 일정 시작 시간
 * @param {Date|Object} endAt - 일정 종료 시간
 * @param {string} [memo=""] - 일정 메모
 * @param {boolean} [isPublic=false] - 일정 공개 여부
 * @param {string} [source="manual"] - 일정 출처 (manual or ics)
 * @param {string} [groupId=""] - 일정이 속한 그룹 id
 * @returns {Promise<Object>} 일정 생성 결과 (성공 또는 실패 응답)
 */
export async function createEvent(
  title,
  startAt,
  endAt,
  memo = "",
  isPublic = false,
  source = "manual",
  groupId = "",
) {
  try {
    if (title === "" || startAt === null || endAt === null) {
      return fail({ code: 400, message: "필수 항목을 입력해주세요." });
    } else if (source != "manual" && source != "ics") {
      return fail({ code: 400, message: "잘못된 출처 입력입니다." });
    }

    const uid = requiredUid();

    let docs = await createEventDoc(
      uid,
      title,
      startAt,
      endAt,
      memo,
      isPublic,
      source,
      groupId,
    );

    console.log("일정 생성 성공!", title);
    return ok(docs);
  } catch (e) {
    console.error("일정 생성 실패 : ", e);
    return fail(e);
  }
}

/**
 * 단일 일정 조회
 *
 * 일정 id를 기준으로 특정 일정의 상세 정보를 조회한다.
 *
 * @param {string} eventId - 조회할 일정 id
 * @returns {Promise<Object|null>} 일정 정보 또는 조회 실패 응답
 */
export async function getEventById(eventId) {
  try {
    console.log("단일 일정 조회 실행");

    let result = await getEventDocById(eventId);
    if (!result) return null;

    return ok(result);
  } catch (e) {
    console.error("단일 일정 조회 실패 : ", e);
    return fail(e);
  }
}

/**
 * 사용자 전체 일정 조회
 *
 * 현재 로그인한 사용자의 개인 일정과
 * 사용자가 소속된 모든 그룹의 일정을 함께 조회한다.
 *
 * @returns {Promise<Object>} 사용자 개인 일정과 그룹 일정 목록
 */
export async function getUserEvents() {
  try {
    console.log("유저 일정 조회 실행");

    const uid = requiredUid();

    // 1. 사용자의 그룹 ID 목록 가져오기
    const groupResult = await getUserGroupIds();

    if (!groupResult.success) {
      return groupResult;
    }

    const groupIds = groupResult.data ?? [];

    // 2. 개인 일정 가져오기
    const userEvents = (await getUserEventDocs(uid)) ?? [];

    // 3. 그룹별 일정 가져오기
    const groupResults = await Promise.all(
      groupIds.map((groupId) => getGroupEventDocs(groupId)),
    );

    const groupEvents = groupResults.flatMap((events) => events ?? []);

    // 4. 개인 일정과 그룹 일정 합치기
    const result = [...userEvents /* ...groupEvents */];

    return ok(result);
  } catch (e) {
    console.error("유저 일정 조회 실패:", e);
    return fail(e);
  }
}
/**
 * 사용자 공개 일정 조회
 *
 * 현재 로그인한 사용자가 생성한 일정 중
 * 공개 설정된 일정 목록을 조회한다.
 *
 * @returns {Promise<Object>} 사용자 공개 일정 목록
 */
export async function getUserPublicEvents() {
  try {
    let uid = requiredUid();

    let events = await getUserPublicEventDocs(uid);

    return ok(events);
  } catch (e) {
    console.error("유저 공개 일정 조회 실패 : ", e);
    return fail(e);
  }
}

/**
 * 그룹 일정 조회
 *
 * 현재 로그인한 사용자의 그룹 소속 여부를 확인한 후
 * 해당 그룹에 등록된 일정 목록을 조회한다.
 *
 * @param {string} groupId - 일정을 조회할 그룹 id
 * @returns {Promise<Object>} 그룹 일정 목록 또는 조회 실패 응답
 */
export async function getGroupEvents(groupId) {
  try {
    console.log("그룹 일정 조회 실행");
    let uid = requiredUid();

    let groupIds = await getUserGroupIds(uid);

    // 사용자가 속한 그룹인지 확인
    if (!Object.keys(groupIds).includes(groupId)) {
      return fail({
        code: 400,
        message: "사용자가 속한 그룹이 아닙니다.",
      });
    }

    let result = await getGroupEventDocs(groupId);

    return ok(result);
  } catch (e) {
    console.error("유저 일정 조회 실패 :", e);
    fail(e);
  }
}

/**
 * 일정 수정
 *
 * 일정 존재 여부와 로그인 상태를 확인한 후
 * 실제 변경이 필요한 항목만 추출하여 일정 정보를 수정한다.
 *
 * @param {string} eventId - 수정할 일정 id
 * @param {Object} contents - 수정할 일정 정보
 * @returns {Promise<Object>} 일정 수정 결과 (성공 또는 실패 응답)
 */
export async function updateEvent(eventId, contents = {}) {
  try {
    console.log("일정 수정 실행");

    if (!eventId || !contents)
      return fail({
        code: 400,
        message: "필수 입력 사항을 확인해주세요.",
      });

    requiredUid();

    if (!(await isExistEvent(eventId))) {
      return fail({
        code: 400,
        message: "수정할 일정이 존재하지 않습니다.",
      });
    }

    const updateField = await getToUpdateContent("events", eventId, contents);

    if (!updateField) {
      return fail({ code: 400, message: "변경된 항목이 없습니다." });
    }

    let result = await updateEventDoc(eventId, updateField);

    return ok(result);
  } catch (e) {
    console.error("일정 수정 실패", e);
    return fail(e);
  }
}

/**
 * 일정 검색
 *
 * 일정 제목을 기준으로 현재 로그인한 사용자의 일정을 검색한다.
 * 검색 결과의 timestamp 필드를 date 객체로 변환한다.
 *
 * @param {string} title - 검색할 일정 제목 또는 키워드
 * @returns {Promise<Object>} 검색된 일정 목록 (검색어가 없으면 null)
 */
export async function findEventByTitle(title) {
  try {
    console.log("일정 검색 실행");

    title = title.trim();
    if (!title) return ok(null);

    let uid = requiredUid();

    let events = await findEventDoc(uid, title);

    const result = events.map((event) => ({
      ...event,
      startAt: toDate(event.startAt),
      endAt: toDate(event.endAt),
      updateAt: toDate(event.updateAt),
    }));

    console.log(result);

    return ok(result);
  } catch (e) {
    console.error("일정 검색 실패", e);
    return fail(e);
  }
}

/**
 * 일정 삭제
 *
 * 일정 존재 여부를 확인한 후 해당 일정 문서를 삭제한다.
 *
 * @param {string} eventId - 삭제할 일정 id
 * @returns {Promise<Object>} 일정 삭제 결과 (성공 또는 실패 응답)
 */
export async function deleteEvent(eventId) {
  try {
    console.log("일정 삭제 실행");

    if (!eventId) {
      return fail({ code: 400, message: "필수 항목을 입력해주세요" });
    } else if (!(await isExistEvent(eventId))) {
      return fail({
        code: 400,
        message: "삭제할 일정이 존재하지 않습니다.",
      });
    }

    let result = await deleteEventDoc(eventId);

    if (result) return ok(result);
    else return fail({ code: 400, message: "존재하지 않는 일정입니다." });
  } catch (e) {
    console.error("일정 삭제 실패: ", e);
    return fail(e);
  }
}

/**
 * 월별 일정 조회
 *
 * 사용자의 모든 일정과 그룹의 모든 공개 일정을 받아와
 * 해당 연월의 일정을 걸러 조회
 *
 * @param {number} year
 * @param {number} month
 * @returns
 */
export async function getMonthEvents(year, month) {
  try {
    console.log("월별 일정 조회 실행");
    if (!year || !month) {
      return fail({
        code: 400,
        message: "필수 입력 항목을 입력해주세요",
      });
    }

    const uid = requiredUid();

    const result = await getMonthEventDocs(uid, year, month);
    if (result === null) console.warn("조회된 일정이 없습니다.");

    return ok(result);
  } catch (e) {
    console.error("월별 일정 조회 실패 : ", e);
    return fail(e);
  }
}

// ---------ics

/**
 * ics파일의 이스케이프 문자를 원래 문자로 복원한다.
 *
 * @param {string} text - 변환할 ics 텍스트
 * @returns {string} 복원된 텍스트
 */
function escapeToText(text) {
  return text
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

/**
 * ics 날짜 문자열을 date 객체로 변환한다.
 *
 * @param {string} value - ics 날짜 문자열
 * @returns {Date} 변환된 date 객체
 */
function parseIcsDate(value) {
  const year = Number(value.substring(0, 4));
  const month = Number(value.substring(4, 6)) - 1; // 월은 0부터
  const day = Number(value.substring(6, 8));

  // 날짜만 있는 경우 (종일 일정)
  if (value.length === 8) return new Date(year, month, day);

  const hour = Number(value.substring(9, 11));
  const minute = Number(value.substring(11, 13));
  const second = Number(value.substring(13, 15));

  // Z로 끝나면 UTC 시간 → 브라우저가 한국 시간으로 변환
  if (value.endsWith("Z")) {
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }

  return new Date(year, month, day, hour, minute, second);
}

/**
 * ics 텍스트에서 VEVENT 단위로 일정 정보를 추출한다.
 *
 * @param {string} text - ics 파일 전체 텍스트
 * @returns {Object[]} { SUMMARY, DTSTART, DTEND, DESCRIPTION, ... } 형태의 객체 배열
 */
function parseIcs(text) {
  // 줄 나누기 (공백/탭으로 시작하는 줄은 이전 줄에 이어붙이기)
  const lines = [];
  for (const line of text.split(/\r?\n/)) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.substring(1);
    } else if (line) {
      lines.push(line);
    }
  }

  // BEGIN:VEVENT ~ END:VEVENT 사이를 하나의 일정으로 묶기
  const events = [];
  let current = null;
  let inAlarm = false; // 일정 안의 알림(VALARM) 영역은 무시

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") current = {};
    else if (line === "END:VEVENT") {
      if (current) events.push(current);
      current = null;
    } else if (line === "BEGIN:VALARM") inAlarm = true;
    else if (line === "END:VALARM") inAlarm = false;
    else if (current && !inAlarm) {
      // 값 안에도 ':'가 있을 수 있으므로 첫 번째 ':' 기준으로만 나누기
      const index = line.indexOf(":");
      if (index === -1) continue;

      const name = line.substring(0, index).split(";")[0];
      current[name] = line.substring(index + 1);
    }
  }

  return events;
}

/**
 * ics 파일을 통한 일정 가져오기
 *
 * ics 파일을 읽어 일정 정보를 추출한 후
 * 현재 로그인한 사용자의 개인 일정으로 저장한다.
 * 기존에 가져온 ics 일정은 삭제되고 새 파일의 일정으로 대체된다.
 *
 * @param {File} file - 업로드한 ics 파일
 * @returns {Promise<Object>} 저장된 일정 개수 (성공 또는 실패 응답)
 */
export async function importIcsEvents(file) {
  try {
    console.log("ics 일정 가져오기 실행");

    if (!file || !file.name.toLowerCase().endsWith(".ics")) {
      return fail({ code: 400, message: "ics 파일을 선택해주세요." });
    }

    const uid = requiredUid();

    const text = await file.text();
    const events = [];

    for (const raw of parseIcs(text)) {
      // 시작 날짜가 없으면 건너뛰기
      if (!raw.DTSTART) continue;

      const startAt = parseIcsDate(raw.DTSTART);
      if (isNaN(startAt)) continue;

      let endAt = raw.DTEND ? parseIcsDate(raw.DTEND) : startAt;

      // 종일 일정의 DTEND는 다음 날 0시니까 1ms 빼서 전날 23:59:59로 맞추기
      if (raw.DTSTART.length === 8 && raw.DTEND) {
        endAt = new Date(endAt.getTime() - 1);
      }

      events.push({
        title: raw.SUMMARY ? escapeToText(raw.SUMMARY) : "(제목 없음)",
        startAt: startAt,
        endAt: endAt,
        memo: raw.DESCRIPTION ? escapeToText(raw.DESCRIPTION) : "",
      });
    }

    if (events.length === 0) {
      return fail({ code: 400, message: "가져올 일정이 없습니다." });
    }

    const count = await replaceIcsEventDocs(uid, events);

    return ok(count);
  } catch (e) {
    console.error("ics 일정 가져오기 실패 : ", e);
    return fail(e);
  }
}
