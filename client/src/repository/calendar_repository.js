import { db } from "../../app.js";
import { toEntity } from "../services/common.js";
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

1. 일정 문서 생성
   - createEventDoc(uid, title, startAt, endAt, memo, isPublic, source, groupId)
   - 기초 구현 완료

2. 일정 문서 조회
   - getUserEventDocs(uid) - 기초 구현 완료
   - getUserPublicEventDocs(uid) - 기초 구현 완료
   - getGroupEventDocs(groupId)
   - getEventDocById(eventId)

3. 일정 문서 수정
   - updateEventDoc(eventId, contents) - 기초 구현 완료

4. 일정 문서 검색
   - findEventDoc(uid, title) - 기초 구현 완료

5. 일정 문서 삭제
   - deleteEventDoc(eventId) - 기초 구현 완료
=====================
*/

/**
 * 일정 문서 존재 여부 확인
 *
 * 전달받은 일정 id를 기준으로 해당 일정 문서가
 * 존재하는지 확인한다.
 *
 * @param {string} eventId - 존재 여부를 확인할 일정 id
 * @returns {Promise<boolean>} 일정 문서 존재 여부
 */
export async function isExistEvent(eventId) {
    // 문서 존재 여부 확인
    const docRef = doc(db, "events", eventId);
    let docSnap = await getDoc(docRef);

    return docSnap.exists();
}

/**
 * 일정 문서 생성
 *
 * 전달받은 일정 정보를 기반으로 새로운 일정 문서를 생성한다.
 * 생성된 문서 id를 일정 데이터의 id 필드에 저장하며,
 * 마지막 수정 시각을 updateAt 필드에 기록한다.
 *
 * @param {string} uid - 일정을 생성한 사용자의 uid
 * @param {string} title - 일정 제목
 * @param {Date|Object} startAt - 일정 시작 시간
 * @param {Date|Object} endAt - 일정 종료 시간
 * @param {string} memo - 일정 메모
 * @param {boolean} isPublic - 일정 공개 여부
 * @param {string} source - 일정 출처 (manual 또는 ics)
 * @param {string} groupId - 일정이 속한 그룹 id
 * @returns {Promise<boolean>} 일정 문서 생성 성공 여부
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

/**
 * 단일 일정 문서 조회
 *
 * 일정 id를 기준으로 특정 일정 문서를 조회한다.
 * 문서가 존재하면 toEntity를 사용해 객체로 변환하여 반환한다.
 *
 * @param {string} eventId - 조회할 일정 id
 * @returns {Promise<Object|null>} 일정 정보 객체 (문서가 없으면 null)
 */
export async function getEventDocById(eventId) {
    try {
        let docRef = await getDoc(doc(db, "events", eventId));
        if (docRef.exists()) {
            const event = toEntity(docRef);

            return event;
        } else return null;
    } catch (e) {
        console.error("eventId로 일정 조회 실패 : ", e);
        throw e;
    }
}

/**
 * 사용자 전체 일정 조회
 *
 * 사용자 uid를 기준으로 해당 사용자의 모든 일정 문서를 조회한다.
 * 조회된 문서는 toEntity를 사용해 객체 배열로 변환한다.
 *
 * @param {string} uid - 일정을 조회할 사용자의 uid
 * @returns {Promise<Object[]|null>} 일정 정보 객체 배열
 */
export async function getUserEventDocs(uid) {
    try {
        // 문서 데이터 가져오기(객체 변환)
        let result = await getDocs(
            query(collection(db, "events"), where("uid", "==", uid)),
        );
        const dataList = result.docs.map(toEntity);

        // 데이터 없으면 null
        return dataList.length === 0 ? null : dataList;
    } catch (e) {
        console.error("유저 db 일정 조회 실패 :", e);
        throw e;
    }
}

/**
 * 사용자 공개 일정 조회
 *
 * 사용자 uid와 공개 여부를 기준으로 해당 사용자가 생성한
 * 공개 일정 문서를 조회한다.
 *
 * @param {string} uid - 일정을 조회할 사용자의 uid
 * @returns {Promise<QuerySnapshot|null>} 공개 일정 문서 조회 결과
 */
export async function getUserPublicEventDocs(uid) {
    try {
        let result = await getDocs(
            query(
                collection(db, "events"),
                where("uid", "==", uid),
                where("isPublic", "==", true),
            ),
        );

        const dataList = result.docs.map(toEntity);

        return dataList.length === 0 ? null : dataList;
    } catch (e) {
        console.error("유저 db 공개 일정 조회 실패 : ", e);
        throw e;
    }
}

/**
 * 그룹 전체 일정 조회
 *
 * 그룹 id를 기준으로 해당 그룹에 등록된 모든 일정 문서를 조회한다.
 * 조회된 문서는 toEntity를 사용해 객체 배열로 변환한다.
 *
 * @param {string} groupId - 일정을 조회할 그룹 id
 * @returns {Promise<Object[]|null>} 그룹 일정 정보 객체 배열
 */
export async function getGroupEventDocs(groupId) {
    try {
        // 문서 데이터 가져오기(객체 변환)
        let result = await getDocs(
            query(collection(db, "events"), where("groupId", "==", groupId)),
        );
        const dataList = result.docs.map(toEntity);

        // 데이터 없으면 null
        return dataList.length === 0 ? null : dataList;
    } catch (e) {
        console.error("그룹 db 일정 조회 실패 :", e);
        throw e;
    }
}

/**
 * 일정 문서 수정
 *
 * 일정 id를 기준으로 기존 일정 문서의 정보를 수정한다.
 * 전달받은 변경사항을 수정하고 updateAt 필드에 수정 시각을 갱신한다.
 *
 * @param {string} eventId - 수정할 일정 id
 * @param {Object} contents - 수정할 일정 정보
 * @returns {Promise<boolean>} 일정 문서 수정 성공 여부
 */
export async function updateEventDoc(eventId, contents) {
    try {
        console.log("일정 수정 DB 실행");

        // 변경사항과 업데이트 시각 문서 수정
        await updateDoc(doc(db, "events", eventId), {
            ...contents,
            updateAt: serverTimestamp(),
        });

        return true;
    } catch (e) {
        console.error("일정 수정 실패", e);
        throw e;
    }
}

/**
 * 일정 제목 검색
 *
 * 사용자 uid를 기준으로 사용자의 개인 일정과 소속 그룹의 일정을 함께 검색한다.
 * 일정 제목을 기준으로 검색어와 일치하거나 검색어로 시작하는 문서를 조회한다.
 *
 * @param {string} uid - 검색을 수행하는 사용자의 uid
 * @param {string} title - 검색할 일정 제목 또는 키워드
 * @returns {Promise<Object[]|null>} 검색된 일정 정보 객체 배열 (결과가 없으면 null)
 */
export async function findEventDoc(uid, title) {
    try {
        let userDoc = await getDoc(doc(db, "users", uid));

        // 사용자 문서 존재 여부 확인
        if (!userDoc.exists()) {
            throw new Error("존재하지 않는 사용자입니다.");
        }

        let userData = userDoc.data();

        // 사용자 그룹 소속 여부 확인
        if (!userData.groupIds) {
            throw new Error("사용자가 그룹에 속하지 않습니다.");
        }

        let groupIds = Object.keys(userData.groupIds);

        let eventRef = collection(db, "events");
        let comparer =
            groupIds.length === 0
                ? where("uid", "==", uid)
                : or(where("uid", "==", uid), where("groupId", "in", groupIds));

        // 개인 일정 및 소속 그룹 일정 검색
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

            // 검색 결과가 없으면 null 반환
            return dataList.length === 0 ? null : dataList;
        } else throw new Error("cal-repo/result 없음");
    } catch (e) {
        console.error("일정 검색 실패", e);
        throw e;
    }
}

/**
 * 일정 문서 삭제
 *
 * 일정 id를 기준으로 firestore에 저장된 해당 일정 문서를 삭제한다.
 *
 * @param {string} eventId - 삭제할 일정 id
 * @returns {Promise<boolean>} 일정 문서 삭제 성공 여부
 */
export async function deleteEventDoc(eventId) {
    try {
        console.log("일정 삭제 DB 실행");

        await deleteDoc(doc(db, "events", eventId));

        return true;
    } catch (e) {
        console.error("일정 삭제 실패", e);
        throw e;
    }
}
