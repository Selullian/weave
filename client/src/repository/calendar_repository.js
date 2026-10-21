import { db } from "../../app.js";
import { getUserDoc } from "../repository/auth_repository.js";
import {
    addDoc,
    updateDoc,
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
  - getEventDoc(uid, [groupId]) - 기초 구현 완료
3. 일정 문서 수정
  - updateEventDoc(eventId, contents) - 기초 구현 완료
4. 일정 문서 검색
  - findEventDoc(title) - 구현 중
5. 일정 문서 삭제
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
                updateAt: serverTimestamp(),
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

// 2. 유저 혹은 그룹의 모든 일정 조회
export async function getEventDocs(uid, groupId = "") {
    try {
        // uid 존재 검증
        if (!uid) throw new Error("uid는 필수 매개변수입니다.");
        let eventRef = await collection(db, "events");

        let q;
        if (groupId === "") {
            // 사용자의 모든 문서 쿼리
            q = query(eventRef, where("uid", "==", uid));
        } else {
            // 그룹 내의 모든 일정 조회
            q = query(eventRef, where("groupId", "==", groupId));
        }

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

// 변경된 필드만 추출하는 함수
async function getToUpdateContent(eventId, contents) {
    let originalRef = await getDoc(doc(db, "events", eventId));
    let originalData = originalRef.data();

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

// 3. 일정 수정
export async function updateEventDoc(uid, eventId, contents) {
    try {
        console.log("일정 수정 DB 실행");

        // 문서 존재 검증
        let docRef = doc(db, "events", eventId);
        let docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            console.warn("해당 일정이 존재하지 않습니다.");
            return false;
        }

        // 수정 권한 확인
        let originData = docSnap.data();
        let userInfo = await getUserDoc(uid);
        let userGroups = userInfo.groupIds;
        console.log(userGroups);

        if (
            originData.uid !== uid &&
            !Object.keys(userGroups).includes(originData.groupId)
        ) {
            throw new Error("일정 수정 권한이 없습니다");
        }

        // 변경된 필드만 추출
        let updateData = await getToUpdateContent(eventId, contents);

        if (Object.keys(updateData).length === 0) {
            console.warn("일정에 변경 사항이 없습니다.");
            return true;
        }

        // 변경사항과 업데이트 시각 문서 수정
        await updateDoc(docRef, {
            ...updateData,
            updateAt: serverTimestamp(),
        });

        return true;
    } catch (e) {
        console.error("일정 수정 실패", e);
        throw e;
    }
}

// 4. 일정 검색
export async function findEventDoc(uid, title) {
    try {
        if (!title) throw new Error("검색할 제목을 입력해주세요");
        let userDoc = await getDoc(doc(db, "users", uid));
        let groupIds = Object.keys(userDoc.data().groupIds);
        console.log(groupIds);

        let eventRef = collection(db, "events");
        let comparer =
            groupIds.length === 0
                ? where("uid", "==", uid)
                : or(
                      where("uid", "==", uid),
                      where("groupId", "array-contains-any", groupIds),
                  );

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
            const dataList = result.docs.map((doc) => ({
                ...doc.data(),
            }));

            // 없으면 null
            if (dataList.length === 0) return null;
            else return dataList;
        } else throw new Error("cal-repo/result 없음");
    } catch (e) {
        console.error("일정 검색 실패", e);
    }
}
