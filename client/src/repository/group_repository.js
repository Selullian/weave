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
groupId
name
description
ownerId
memberIds
color
memberColors
updatedAt
*/

/*
==============================
그룹 문서 관리
1. 그룹 생성
    - createGroupDoc({name, description, color, ownerId}) -> 기초 구현 완료
2. 그룹 조회
    - getUserGroupDocs() -> 구현 중
    - getGroupDoc(groupId) -> 구현 전
3. 그룹 수정
4. 그룹 삭제
5. 그룹 멤버 추가
6. 그룹 멤버 삭제
7. 멤버별 그룹 색상 수정


*/

async function isExistGroup(groupId) {
    // 문서 존재 검증
    const docRef = doc(db, "groups", groupId);
    let docSnap = await getDoc(docRef);

    return docSnap.exists();
}

// 그룹 생성
export async function createGroupDoc({ name, description, color, ownerId }) {
    try {
        console.log("그룹 문서 생성 실행");
        let newRef = doc(collection(db, "groups"));

        await setDoc(newRef, {
            groupId: newRef.id,
            name: name,
            description: description,
            ownerId: ownerId,
            memberIds: [],
            color: color,
            memberColors: {},
            updateAt: serverTimestamp(),
        });

        console.log("Document 생성 완료, name : ", name);
        return true;
    } catch (e) {
        console.error("그룹 생성 DB 실패", e);
        throw e;
    }
}

// 단일 그룹 문서 조회
export async function getGroupDoc(groupId) {
    try {
        console.log("단일 그룹 문서 조회");
        let docRef = await getDoc(doc(db, "groups", groupId));
        if (docRef.exists()) {
            const group = toEntity(docRef);
            return group;
        }
        return null;
    } catch (e) {
        console.error("단일 그룹 문서 조회 실패 : ", e);
        throw e;
    }
}

// 사용자의 그룹 조회
export async function getUserGroupDocs(uid) {
    try {
        console.log("사용자 그룹 문서 조회");

        const q = query(collection(db, "groups"), where("uid", "==", uid));
        let docsRef = await getDocs(q);

        const result = docsRef.docs.map(toEntity);

        return result ? result : null;
    } catch (e) {
        console.error("모든 그룹 문서 조회 실패 : ", e);
        throw e;
    }
}
