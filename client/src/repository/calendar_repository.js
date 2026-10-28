import { db } from "../../app.js";
import {
    setDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    collection,
    doc,
    query,
    where,
    or,
    startAt,
    endAt,
    orderBy,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/*
=====================
일정 문서 관리

1. 일정 문서 추가
  - createEventDoc(uid, title, startAt, endAt, memo, isPublic, source, groupId) - 기초 구현 완료
2. 일정 문서 조회
  - getUserEventDoc(uid, [groupId]) - 기초 구현 완료
  - getUserPublicEventDoc() - 기초 구현 완료
  - getGroupEventDoc()
3. 일정 문서 수정
  - updateEventDoc(eventId, contents) - 기초 구현 완료
4. 일정 문서 검색
  - findEventDoc(uid, title) - 기초 구현 완료
5. 일정 문서 삭제
  - deleteEventDoc(eventId) - 기초 구현 완료
=====================
*/

const toEntity = (doc) => ({
    ...doc.data(),
});

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
        let newRef = doc(collection(db, "events"));

        await setDoc(newRef, {
            id: newRef.id,
            uid: uid,
            title: title,
            startAt: startAt,
            endAt: endAt,
            memo: memo,
            isPublic: isPublic,
            source: source,
            groupId: groupId,
            updateAt: serverTimestamp(),
        });

        console.log("Document 생성 완료, title : ", title);
        return true;
    } catch (e) {
        console.error("문서 생성 실패 :", e);
        throw e;
    }
}

// 2. 유저의 모든 일정 조회
export async function getUserEventDocs(uid) {
    try {
        // 문서 데이터 가져오기(객체 변환)
        let result = await getDocs(
            query(collection(db, "events"), where("uid", "==", uid)),
        );
        const dataList = result.docs.map(toEntity);

        // 데이터 없으면 null
        return dataList ? dataList : null;
    } catch (e) {
        console.error("유저 db 일정 조회 실패 :", e);
        throw e;
    }
}

export async function getUserPublicEventDoc(uid) {
    try {
        let result = await getDocs(
            query(
                collection(db, "events"),
                where("uid", "==", uid),
                where("isPublic", "==", true),
            ),
        );

        return result ? result : null;
    } catch (e) {
        console.error("유저 DB 공개 일정 조회 실패 : ", e);
        throw e;
    }
}
// 그룹의 모든 일정 조회
export async function getGroupEventDocs(groupId) {
    try {
        // 문서 데이터 가져오기(객체 변환)
        let result = await getDocs(
            query(collection(db, "events"), where("groupId", "==", groupId)),
        );
        const dataList = result.docs.map(toEntity);

        // 데이터 없으면 null
        return dataList ? dataList : null;
    } catch (e) {
        console.error("그룹 db 일정 조회 실패 :", e);
        throw e;
    }
}

// 3. 일정 수정
export async function updateEventDoc(eventId, contents) {
    try {
        console.log("일정 수정 DB 실행");

        // 문서 존재 검증
        let docRef = doc(db, "events", eventId);
        let docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            console.error("해당 일정이 존재하지 않습니다.");
            throw new Error("수정할 일정 데이터가 존재하지 않습니다.");
        }

        // 변경사항과 업데이트 시각 문서 수정
        await updateDoc(docRef, {
            ...contents,
            updateAt: serverTimestamp(),
        });

        return;
    } catch (e) {
        console.error("일정 수정 실패", e);
        throw e;
    }
}

// 4. 일정 검색
export async function findEventDoc(uid, title) {
    try {
        let userDoc = await getDoc(doc(db, "users", uid));
        let groupIds = Object.keys(userDoc.data().groupIds);

        let eventRef = collection(db, "events");
        let comparer =
            groupIds.length === 0
                ? where("uid", "==", uid)
                : or(where("uid", "==", uid), where("groupId", "in", groupIds));

        // 사용자
        const q = query(
            eventRef,
            comparer,
            orderBy("title"),
            startAt(title),
            endAt(title + "\uf8ff"),
        );

        let result = await getDocs(q);
        if (result) {
            const dataList = result.docs.map(toEntity);
            console.log(dataList);

            // 없으면 null
            return dataList.length === 0 ? null : dataList;
        } else throw new Error("cal-repo/result 없음");
    } catch (e) {
        console.error("일정 검색 실패", e);
        throw e;
    }
}

// 5. 일정 삭제
export async function deleteEventDoc(eventId) {
    try {
        const docRef = doc(db, "events", eventId);
        await deleteDoc(docRef);

        return true;
    } catch (e) {
        console.error("일정 삭제 실패", e);
        throw e;
    }
}
