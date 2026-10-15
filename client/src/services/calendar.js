/*
========================
일정 관리
1. 일정 추가
  - createEvent(title, startAt, endAt, [memo], [isPublic], [source], [groupId]) - 구현 중
2. 유저의 모든 일정 조회 ()
  - getUserEvents() - 구현 중
3. 일정 수정
4. 일정 삭제
5. 일정 검색
6. ics 확장자로 일정 덮어쓰기
7. 소유자 확인
========================
*/

import { auth } from "../../app.js";
import {
    createEventDoc,
    getUserEventDocs,
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
export async function getUserEvents(groupId = "") {
    try {
        let uid = auth.currentUser.uid;
        if (!uid) throw new Error("유저 확인 실패");

        let result = await getUserEventDocs(uid);

        // 데이터 없으면 null
        if (result) return result;
        else return null;
    } catch (e) {
        console.error("유저 일정 조회 실패 :", e);
    }
}
