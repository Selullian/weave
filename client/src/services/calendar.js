/*
========================
일정 관리
1. 일정 추가
  - createEvent(title, startAt, endAt, [memo], [isPublic], [source], [groupId]) - 기초 구현 완료
2. 유저의 모든 일정 조회 ()
  - getUserEvents() - 기초 구현 완료
3. 그룹의 모든 일정 조회 ()
  - getGroupEvents() - 테스트 미확인 (아직 그룹 없음)
3. 일정 수정
  - updateEvent() - 기초 구현 완료
4. 일정 삭제
  - deleteEvent() - 구현 전
5. 일정 검색
  - findEventByTitle() - 기초 구현 완료
6. ics 확장자로 일정 덮어쓰기
7. 소유자 확인(왜 넣었더라?)
========================
*/

import { auth } from "../../app.js";
import {
    createEventDoc,
    getEventDocs,
    updateEventDoc,
    findEventDoc,
} from "../repository/calendar_repository.js";

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
        if (title.trim() === "" || startAt === null || endAt === null) {
            throw new Error("필수 항목을 입력해주세요.");
        } else if (source != "manual" && source != "ics") {
            throw new Error("잘못된 출처 입력");
        }

        const user = auth.currentUser;
        if (!user) throw new Error("로그인이 필요합니다.");
        const uid = user.uid;

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
        if (docs === null) {
            throw new Error("일정 생성 실패");
        } else {
            console.log("일정 생성 성공!", title);
            return docs;
        }
    } catch (e) {
        console.error("일정 생성 실패 : ", e);
    }
}

// 2. 유저의 모든 일정 조회 가능
export async function getUserEvents() {
    try {
        console.log("유저 일정 조회 실행");

        let user = auth.currentUser;
        if (!user) throw new Error("유저 확인 실패");
        let uid = user.uid;

        let result = await getEventDocs(uid);

        // 데이터 없으면 null
        return result;
    } catch (e) {
        console.error("유저 일정 조회 실패 :", e);
    }
}

// 3. 그룹의 모든 일정 조회 가능
export async function getGroupEvents(groupId) {
    try {
        console.log("그룹 일정 조회 실행");

        let user = auth.currentUser;
        if (!user) throw new Error("유저 확인 실패");
        let uid = user.uid;

        let result = await getEventDocs(uid, groupId);

        // 데이터 없으면 null
        return result;
    } catch (e) {
        console.error("유저 일정 조회 실패 :", e);
    }
}

//4. 일정 수정
export async function updateEvent(eventId, contents = {}) {
    try {
        console.log("일정 수정 실행");
        if (!eventId || !contents) throw new Error("필수 항목을 입력해주세요.");

        let user = auth.currentUser;
        if (!user) throw new Error("유저 확인 실패");
        let uid = user.uid;

        let result = await updateEventDoc(uid, eventId, contents);
        // 성공 시 true
        return result;
    } catch (e) {
        console.error("일정 수정 실패", e);
    }
}

// 5. 일정 검색
export async function findEventByTitle(title) {
    try {
        title = title.trim();
        if (!title) return null;

        let user = auth.currentUser;
        if (!user) throw new Error("유저 확인 실패");
        let uid = user.uid;

        let events = await findEventDoc(uid, title);
        console.log(events[0].startAt);

        const result = events.map((event) => ({
            ...event,
            startAt: new Date(event.startAt.seconds * 1000),
            endAt: new Date(event.endAt.seconds * 1000),
            updateAt: new Date(event.updateAt.seconds * 1000),
        }));
        console.log(result);

        // 없으면 null
        return events;
    } catch (e) {
        console.error("일정 검색 실패", e);
    }
}
