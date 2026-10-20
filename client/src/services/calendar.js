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
5. 일정 검색
6. ics 확장자로 일정 덮어쓰기
7. 소유자 확인
========================
*/

import { auth } from "../../app.js";
import {
    createEventDoc,
    getEventDocs,
    updateEventDoc,
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
        console.log(title, startAt, endAt);

        if (title.trim() === "" || startAt === null || endAt === null) {
            throw new Error("필수 항목을 입력해주세요.");
        } else if (source != "manual" && source != "ics") {
            throw new Error("잘못된 출처 입력");
        }
        let uid = auth.currentUser.uid;

        let docs = createEventDoc(
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
        let uid = auth.currentUser.uid;
        if (!uid) throw new Error("유저 확인 실패");

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

        let uid = auth.currentUser.uid;
        if (!uid) throw new Error("유저 확인 실패");

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

        let uid = auth.currentUser.uid;
        if (!uid) throw new Error("유저 확인 실패");

        let result = await updateEventDoc(eventId, contents);
        // 성공 시 true
        return result;
    } catch (e) {
        console.error("일정 수정 실패", e);
    }
}
