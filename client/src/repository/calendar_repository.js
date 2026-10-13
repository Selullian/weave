import { db } from "../../app.js";
import {
    setDoc,
    addDoc,
    updateDoc,
    getDoc,
    collection,
    doc,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/*
=====================
일정 문서 관리

1. 일정 문서 추가
  - createEventDoc(uid, title, startAt, endAt, memo, isPublic, source, groupId) - 구현 중
2. 일정 문서 조회
  - getEventDoc(uid, [groupId]) - 구현 전
3. 일정 문서 삭제
4. 일정 문서 검색?
=====================
*/

export async function createEventDoc(
    uid,
    title,
    startAt,
    endAt,
    memo,
    isPublic,
    source,
    groupId,
) {
    try {
        console.log("문서 생성 실행");
        let docRef = await addDoc(collection(db, "events"), {
            uid: uid,
            title: title,
            startAt: startAt,
            endAt: endAt,
            memo: memo,
            isPublic: isPublic,
            source: source,
            groupId: groupId,
        });
        console.log("Document 생성 완료, title : ", title);
        await updateDoc(docRef, {
            id: docRef.id,
        });
        console.log("id 추가 완료");
    } catch (e) {
        console.error("문서 생성 실패 :", e);
        return null;
    }
}
