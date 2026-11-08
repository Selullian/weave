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
        let uid = requiredUid();

        let groupIds = await getUserGroupIds(uid);

        let userEvents = await getUserEventDocs(uid);
        let groupEvents = await getGroupEventDocs(groupIds);

        const result = [...userEvents, ...groupEvents];

        return ok(result);
    } catch (e) {
        console.error("유저 일정 조회 실패 :", e);
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

        const updateField = await getToUpdateContent(
            "events",
            eventId,
            contents,
        );

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
