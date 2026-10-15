import { db } from "../../app.js";
import {
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    collection,
    doc,
    query,
    where,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/*
=====================
일정 문서 관리

1. 일정 문서 추가
  - createEventDoc(uid, title, startAt, endAt, memo, isPublic, source, groupId) - 구현 중
2. 일정 문서 조회
  - getUserEventDoc(uid, [groupId]) - 구현 전
3. 일정 문서 삭제
4. 일정 문서 검색?
=====================
*/

// 1. 일정 생성
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
        if (docRef) {
            console.log("Document 생성 완료, title : ", title);
            await updateDoc(docRef, {
                id: docRef.id,
            });
            console.log("id 추가 완료");
            return docRef;
        } else {
            return null;
        }
    } catch (e) {
        console.error("문서 생성 실패 :", e);
        return null;
    }
}

// 2. 유저의 모든 일정 조회
export async function getUserEventDocs(uid, groupId = "") {
    try {
        console.log(uid);

        // uid 존재 검증
        if (!uid) throw new Error("uid는 필수 매개변수입니다.");
        let eventRef = await collection(db, "events");

        // 사용자 uid와 일치하는 문서 쿼리
        const q = query(eventRef, where("uid", "==", uid));

        // 문서 데이터 가져오기(객체 변환)
        let result = await getDocs(q);
        const dataList = result.docs.map((doc) => ({
            ...doc.data(),
        }));

        // 데이터 없으면 null
        if (dataList) return dataList;
        else return null;
    } catch (e) {
        console.error("유저 db 일정 조회 실패 :", e);
    }
}
