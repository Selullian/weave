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
    serverTimestamp,
    deleteField,
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
    - getUserGroupDocs() -> 기초 구현 완료
    - getGroupDocById(groupId) -> 기초 구현 완료
3. 그룹 수정
- updateGroupDoc() -> 기초 구현 완료
4. 그룹 삭제
- deleteGroupDoc() -> 기초 구현 완료
5. 그룹 멤버 추가
- addMemberDoc() -> 기초 구현 중 
6. 그룹 멤버 삭제
7. 멤버별 그룹 색상 수정

=============================
*/

export async function isExistGroup(groupId) {
    // 문서 존재 검증
    const docRef = doc(db, "groups", groupId);
    let docSnap = await getDoc(docRef);

    console.log(docSnap.exists());

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
            members: {},
            color: color,
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
export async function getGroupDocById(groupId) {
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

        // 사용자의 그룹 목록 가져오기
        const userRef = await getDoc(doc(db, "users", uid));
        const userObj = toEntity(userRef);
        const groupIds = Object.keys(userObj.groupIds);

        const q = query(
            collection(db, "groups"),
            where("groupId", "in", groupIds),
        );
        let docsRef = await getDocs(q);

        const result = docsRef.docs.map(toEntity);

        return result ? result : null;
    } catch (e) {
        console.error("모든 그룹 문서 조회 실패 : ", e);
        throw e;
    }
}

// 그룹 정보 수정
export async function updateGroupDoc(groupId, contents) {
    try {
        console.log("그룹 문서 수정 실행");

        await updateDoc(doc(db, "groups", groupId), {
            ...contents,
            updateAt: serverTimestamp(),
        });

        return true;
    } catch (e) {
        console.error("그룹 문서 수정 실패 : ", e);
        throw e;
    }
}

// 그룹 삭제
export async function deleteGroupDoc(groupId) {
    try {
        console.log("그룹 삭제 DB 실행");

        await deleteDoc(doc(db, "groups", groupId));

        return true;
    } catch (e) {
        console.error("그룹 삭제 실패", e);
        throw e;
    }
}

//랜덤 헥사 코드 생성기
const getRandomHexColor = () => {
    return (
        "#" +
        Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0")
    );
};

/**
 * 그룹에 멤버 관련 정보 추가
 * @param {String} groupId
 * @param {String} uid
 * @returns 멤버의 색상
 */
export async function addMemberDoc(groupId, uid) {
    try {
        console.log("멤버 추가 실행");

        let groupInfo = await getGroupDocById(groupId);
        if (!groupInfo) throw new Error("존재하지 않는 그룹입니다.");

        // 이미 멤버인 경우
        if (Object.keys(groupInfo.members).includes(uid)) return null;

        const memberColor = getRandomHexColor();
        const members = { ...groupInfo.members, [uid]: memberColor };

        await updateDoc(doc(db, "groups", groupId), {
            members,
            updateAt: serverTimestamp(),
        });

        return memberColor;
    } catch (e) {
        console.error("그룹 문서 멤버 추가 실패 : ", e);
        throw e;
    }
}

/**
 * 그룹 문서에서 멤버 삭제
 * @param {String} groupId
 * @param {String} uid
 * @returns 성공 여부 boolean
 */
export async function deleteMemberDoc(groupId, uid) {
    try {
        console.log("그룹 문서 멤버 삭제 실행");

        let groupInfo = await getGroupDocById(groupId);
        if (!groupInfo) throw new Error("존재하지 않는 그룹입니다.");

        // 그룹의 멤버가 아닌 경우
        if (!Object.keys(groupInfo.members).includes(uid))
            throw new Error("그룹의 멤버가 아닙니다.");

        await updateDoc(doc(db, "groups", groupId), {
            [`members.${uid}`]: deleteField(),
            updateAt: serverTimestamp(),
        });

        return true;
    } catch (e) {
        console.error("그룹 문서 멤버 삭제 실패 : ", e);
        throw e;
    }
}

/**
 * 그룹 멤버 목록 조회
 * @param {String} groupId
 * @param {String} uid
 * @returns 데이터 유무(data/null)
 */
export async function getMemberDocs(groupId, uid) {
    try {
        console.log("그룹 문서 멤버 조회 실행");

        const groupDoc = await getGroupDocById(groupId);
        const members = Object.keys(groupDoc.members);
        console.log(members);

        if (!members) return null;
        return members;
    } catch (e) {
        console.error("그룹 문서 멤버 조회 실패 : ", e);
        throw e;
    }
}
