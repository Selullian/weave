/*
========================
일정 관리
1. 일정 추가
  - createEvent(title, startAt, endAt, [memo], [isPublic], [source], [groupId]) - 구현 중
2. 일정 조회
3. 일정 수정
4. 일정 삭제
5. 일정 검색
6. ics 확장자로 일정 덮어쓰기
7. 소유자 확인
========================
*/

import { auth } from "../../app.js";
import { createEventDoc } from "../repository/calendar_repository.js";

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
        if (title.trim() === "" || startAt === "" || endAt === "") {
            throw new Error("필수 항목을 입력해주세요.");
        } else if (source != "manual" && source != "ics") {
            throw new Error("잘못된 출처 입력");
        }
        let uid = auth.currentUser.uid;

        let docRef = createEventDoc(
            uid,
            title,
            startAt,
            endAt,
            memo,
            isPublic,
            source,
            groupId,
        );
        if (docRef === null) console.log("일정 생성 성공!", title);
    } catch (e) {
        console.error("일정 생성 실패 : ", e);
    }
}
