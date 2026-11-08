import { db } from "../../app.js";
import {
    setDoc,
    getDoc,
    doc,
    updateDoc,
    serverTimestamp,
    deleteField,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/**
 * =================================
 * 회원 문서 관리
 *
 * 1. 회원 문서 생성
 *    - createUserDoc(uid, email, name)
 * 2. 회원 정보 조회
 *    - getUserDoc(uid)
 * 3. 회원 정보 수정
 *    - updateUserInfoDoc({ uid, name, groupInfo, removeGroupId })
 *
 * =================================
 */

/**
 * @typedef {Object} User
 * @property {string} uid - 사용자 고유 식별자이며, firebase auth의 uid와 동일한 값
 * @property {string} name - 그룹원 목록 및 그룹 초대 검색 결과에 표시할 사용자 이름
 * @property {string} email - 회원가입 및 로그인에 사용하는 이메일
 * @property {Object.<string, string>} groupIds - 그룹 아이디를 키로, 사용자가 지정한 캘린더 색상을 값으로 저장하는 객체
 */

/**
 * 회원 문서 생성
 *
 * auth에서 발급받은 uid를 문서 id로 사용하여
 * users에 회원 기본 정보를 생성한다.
 *
 * @param {string} uid - auth에서 발급받은 사용자 id
 * @param {string} email - 회원 이메일
 * @param {string} name - 회원 이름
 * @returns {Promise<boolean>} 문서 생성 성공 여부
 */
export async function createUserDoc(uid, email, name) {
    try {
        console.log("문서 생성 실행");
        await setDoc(doc(db, "users", uid), {
            uid: uid,
            name: name,
            email: email,
            groupIds: {},
        });
        console.log("Document 생성 완료, name : ", name);
        return true;
    } catch (e) {
        console.error("Document 생성 오류 : ", e);
        throw e;
    }
}

/**
 * 회원 정보 조회
 *
 * uid를 기준으로 users 컬렉션에서 회원 문서를 조회한다.
 *
 * @param {string} uid - 조회할 사용자의 고유 식별자
 * @returns {Promise<User|null>} 조회한 회원 정보 또는 문서가 존재하지 않을 경우 null
 */
export async function getUserDoc(uid) {
    try {
        console.log("uid로 회원 정보 조회 실행");
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        // 문서 존재 여부 확인
        if (docSnap.exists()) {
            const userData = docSnap.data();
            return userData;
        } else {
            return null;
        }
    } catch (e) {
        console.error("DB 사용자 조회 실패 : ", e);
        throw e;
    }
}

/**
 * 회원 정보 수정
 *
 * 사용자의 이름 및 그룹 정보를 수정한다.
 * 그룹 정보는 기존 데이터를 유지하면서 추가하거나 색상을 변경할 수 있으며,
 * 특정 그룹 id를 지정하여 그룹 정보를 삭제할 수 있다.
 *
 * @param {Object} params - 회원 정보 수정에 필요한 매개변수
 * @param {string} params.uid - 수정할 사용자의 고유 식별자
 * @param {string|null} [params.name=null] - 변경할 사용자 이름
 * @param {Object.<string, string>|null} [params.groupInfo=null] - 추가하거나 색상을 변경할 그룹 정보 (그룹id: #hex)
 * @param {string|null} [params.removeGroupId=null] - 삭제할 그룹 아이디
 * @returns {Promise<boolean>} 문서 수정 성공 여부
 */
export async function updateUserInfoDoc({
    uid,
    name = null,
    groupInfo = null,
    removeGroupId = null,
}) {
    try {
        console.log("회원 문서 수정 실행");

        let updateContents = {};

        // 이름 수정
        if (name) updateContents.name = name;

        // 그룹 추가 또는 색상 수정
        if (groupInfo) {
            for (const [groupId, color] of Object.entries(groupInfo)) {
                if (groupId) {
                    updateContents[`groupIds.${groupId}`] = color;
                }
            }
        }

        // 특정 그룹 삭제
        if (removeGroupId) {
            updateContents[`groupIds.${removeGroupId}`] = deleteField();
        }

        if (Object.keys(updateContents).length === 0)
            throw new Error("수정할 항목을 필수로 입력해주세요.");

        await updateDoc(doc(db, "users", uid), {
            ...updateContents,
            updateAt: serverTimestamp(),
        });

        return true;
    } catch (e) {
        console.error("회원 문서 수정 실패 : ", e);
        throw e;
    }
}
