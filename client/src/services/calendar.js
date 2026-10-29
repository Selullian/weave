/*
========================
일정 관리
1. 일정 추가
  - createEvent(title, startAt, endAt, [memo], [isPublic], [source], [groupId]) - 기초 구현 완료
2. 유저의 모든 일정 조회 ()
  - getUserEvents() - 기초 구현 완료
  - 유저의 공개 일정 조회()
3. 그룹의 모든 일정 조회 ()
  - getGroupEvents() - 테스트 미확인 (아직 그룹 없음)

3. 일정 수정
  - updateEvent() - 기초 구현 완료
4. 일정 삭제
  - deleteEvent() - 구현 전
5. 일정 검색
  - findEventByTitle() - 기초 구현 완료

6. ics 확장자로 일정 가져오기
  - 

7. 소유자 확인(왜 넣었더라?)
========================
*/

import { auth } from "../../app.js";
import { getUserGroupIds } from "../services/auth.js";
import {
    createEventDoc,
    getUserEventDocs,
    getUserPublicEventDocs,
    getGroupEventDocs,
    updateEventDoc,
    findEventDoc,
    deleteEventDoc,
    getDocById,
    isExistEvent,
} from "../repository/calendar_repository.js";

const ok = (data) => {
    return { success: true, data: data };
};
const fail = (e) => {
    return { success: false, error: { code: e.code, message: e.message } };
};

function requiredUid() {
    const user = auth.currentUser;
    if (!user) throw new Error("로그인이 필요합니다.");
    return user.uid;
}

function toDate(date) {
    if (date.seconds) return new Date(date.seconds * 1000);
}

// 1. 일정 추가
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

// 2. 유저의 !모든! 일정 조회 가능
export async function getUserEvents() {
    try {
        console.log("유저 일정 조회 실행");
        let uid = requiredUid();

        let groupIds = await getUserGroupIds(uid);

        let userEvents = await getUserEventDocs(uid);
        let groupEvents = await getGroupEventDocs(groupIds);

        const result = [...userEvents, ...groupEvents];

        // 데이터 없으면 null
        return ok(result);
    } catch (e) {
        console.error("유저 일정 조회 실패 :", e);
        return fail(e);
    }
}

// 유저의 공개 일정 조회
export async function getUserPublicEvents() {
    try {
        let uid = requiredUid();

        // 정보 조회
        let events = await getUserPublicEventDocs(uid);

        return ok(events);
    } catch (e) {
        console.error("유저 공개 일정 조회 실패 : ", e);
        return fail(e);
    }
}

// 3. 그룹 일정 조회 가능
export async function getGroupEvents(groupId) {
    try {
        console.log("그룹 일정 조회 실행");
        let uid = requiredUid();
        let groupIds = await getUserGroupIds(uid);
        if (!Object.keys(groupIds).includes(groupId)) {
            return fail({
                code: 400,
                message: "사용자가 속한 그룹이 아닙니다.",
            });
        }

        let result = await getGroupEventDocs(groupId);

        // 데이터 없으면 null
        return ok(result);
    } catch (e) {
        console.error("유저 일정 조회 실패 :", e);
        fail(e);
    }
}

// 변경된 필드만 추출하는 함수
async function getToUpdateContent(eventId, contents) {
    let originalData = await getDocById(eventId);
    if (originalData) {
        const newData = {
            ...contents,
        };
        const updates = {};
        Object.keys(newData).forEach((key) => {
            if (originalData[key] !== newData[key]) {
                updates[key] = newData[key];
            }
        });

        return updates;
    }
    return null;
}

//4. 일정 수정
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

        const updateField = await getToUpdateContent(eventId, contents);
        if (!updateField) {
            return fail({ code: 400, message: "변경된 항목이 없습니다." });
        }
        let result = await updateEventDoc(eventId, updateField);

        // 성공 시 true
        return ok(result);
    } catch (e) {
        console.error("일정 수정 실패", e);
        return fail(e);
    }
}

// 5. 일정 검색
export async function findEventByTitle(title) {
    try {
        console.log("일정 검색 실행");

        title = title.trim();
        if (!title) return ok(null); // 검색어 없으면 그냥 null

        let uid = requiredUid();

        let events = await findEventDoc(uid, title);

        const result = events.map((event) => ({
            ...event,
            startAt: toDate(event.startAt),
            endAt: toDate(event.endAt),
            updateAt: toDate(event.updateAt),
        }));
        console.log(result);

        // 없으면 null
        return ok(result);
    } catch (e) {
        console.error("일정 검색 실패", e);
        return fail(e);
    }
}

// 6. 일정 삭제
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
