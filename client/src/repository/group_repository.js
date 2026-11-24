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
  writeBatch,
  where,
  orderBy,
  startAt,
  endAt,
  serverTimestamp,
  deleteField,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/*
==============================
그룹 문서 필드
- groupId: 그룹 id
- name: 그룹 이름
- description: 그룹 설명
- ownerId: 그룹 생성자 uid
- members: 멤버 uid와 개별 색상을 저장하는 객체
- color: 그룹 대표 색상
- updatedAt: 문서 수정 시간

==============================
그룹 문서 관리
1. 그룹 생성
2. 그룹 조회
3. 그룹 수정
4. 그룹 삭제
5. 그룹 멤버 추가
6. 그룹 멤버 삭제
7. 그룹 멤버 목록 조회
==============================
*/

/**
 * 그룹 문서의 존재 여부를 확인
 *
 * @param {string} groupId - 존재 여부를 확인할 그룹 id
 * @returns {Promise<boolean>} 그룹 문서 존재 여부
 */
export async function isExistGroup(groupId) {
  const docRef = doc(db, "groups", groupId);
  let docSnap = await getDoc(docRef);

  console.log(docSnap.exists());

  return docSnap.exists();
}

/**
 * 새로운 그룹 문서를 생성
 *
 * @param {Object} params - 그룹 생성에 필요한 정보
 * @param {string} params.name - 그룹 이름
 * @param {string} params.description - 그룹 설명
 * @param {string} params.color - 그룹 대표 색상 (hex 코드)
 * @param {string} params.ownerId - 그룹 생성자 uid
 * @returns {Promise<boolean>} 생성 성공 여부
 */
export async function createGroupDoc({ name, description, color, ownerId }) {
  try {
    const batch = writeBatch(db);

    const newRef = doc(collection(db, "groups"));
    const userRef = doc(db, "users", ownerId);

    const groupData = {
      groupId: newRef.id,
      name,
      description,
      ownerId,
      members: {
        [ownerId]: color, // 기본값은 그룹 색상
      },
      color,
      updateAt: serverTimestamp(),
    };

    // 그룹 문서 생성
    batch.set(newRef, groupData);

    // 생성자의 그룹 목록 업데이트
    // groupIds는 { 그룹id: #hex } 형태, 기본 색상은 그룹 색상
    batch.update(userRef, {
      [`groupIds.${newRef.id}`]: color,
    });

    // 두 작업을 동시에 확정
    await batch.commit();

    console.log("그룹 생성 완료:", groupData);

    return groupData;
  } catch (e) {
    console.error("그룹 생성 실패:", e);
    throw e;
  }
}
/**
 * 그룹 id를 기준으로 단일 그룹 문서를 조회
 *
 * @param {string} groupId - 조회할 그룹 id
 * @returns {Promise<Object|null>} 그룹 정보 객체 (문서가 없으면 null)
 */
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

/**
 * uid 기준 사용자가 속한 모든 그룹 문서를 조회
 *
 * users 문서의 groupIds로 해당 그룹 문서들을 가져온다.
 *
 * @param {string} uid - 사용자 uid
 * @returns {Promise<Object[]|null>} 그룹 정보 객체 배열
 */
export async function getUserGroupDocs(uid) {
  try {
    console.log("사용자 그룹 문서 조회");

    const userRef = await getDoc(doc(db, "users", uid));

    if (!userRef.exists()) {
      console.log("유저 문서가 존재하지 않습니다.");
      return [];
    }

    const userObj = toEntity(userRef);

    let groupIds = [];
    if (userObj && userObj.groupIds) {
      if (Array.isArray(userObj.groupIds)) {
        groupIds = userObj.groupIds; // 배열 형태인 경우 그대로 사용
      } else if (typeof userObj.groupIds === "object") {
        groupIds = Object.keys(userObj.groupIds); // 객체 형태인 경우 Key 배열 추출
      }
    }
    if (!groupIds || groupIds.length === 0) {
      console.log("가입된 그룹이 없습니다.");
      return [];
    }

    const q = query(collection(db, "groups"), where("groupId", "in", groupIds));
    const docsRef = await getDocs(q);
    const result = docsRef.docs.map(toEntity);

    return result || [];
  } catch (e) {
    console.error("모든 그룹 문서 조회 실패 : ", e);
    throw e;
  }
}
/**
 * 그룹 이름 검색
 *
 * 사용자 uid를 기준으로 사용자가 속한 그룹 중에서
 * 그룹 이름이 검색어와 일치하거나 검색어로 시작하는 문서를 조회한다.
 *
 * @param {string} uid - 검색을 수행하는 사용자의 uid
 * @param {string} name - 검색할 그룹 이름 또는 키워드
 * @returns {Promise<Object[]|null>} 검색된 그룹 정보 객체 배열 (결과가 없으면 null)
 */
export async function findGroupDoc(uid, name) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));

    // 사용자 문서 존재 여부 확인
    if (!userDoc.exists()) {
      throw new Error("존재하지 않는 사용자입니다.");
    }

    const userData = userDoc.data();

    // 사용자 그룹 소속 여부 확인
    const groupIds = userData.groupIds ? Object.keys(userData.groupIds) : [];
    if (groupIds.length === 0) return null;

    // 소속 그룹 중 이름이 검색어로 시작하는 그룹 검색
    const q = query(
      collection(db, "groups"),
      where("groupId", "in", groupIds),
      orderBy("name"),
      startAt(name),
      endAt(name + ""),
    );

    const result = await getDocs(q);
    const dataList = result.docs.map(toEntity);

    // 검색 결과가 없으면 null 반환
    return dataList.length === 0 ? null : dataList;
  } catch (e) {
    console.error("그룹 검색 실패 : ", e);
    throw e;
  }
}

/**
 * 기존 그룹 문서의 정보를 수정
 *
 * contents의 필드를 기존 문서에 덮어쓰고
 * 수정 시간을 updateAt에 갱신한다.
 *
 * @param {string} groupId - 수정할 그룹 id
 * @param {Object} contents - 수정할 필드와 값이 담긴 객체
 * @returns {Promise<boolean>} 수정 성공 여부
 */
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

/**
 * 그룹 문서 삭제
 *
 * @param {string} groupId - 삭제할 그룹 id
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
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

/**
 * 그룹 문서에 새로운 멤버 추가
 *
 * 이미 그룹에 속한 사용자는 추가하지 않는다.
 * 신규 멤버의 색상은 기본적으로 그룹 대표 색상으로 설정하고 members에 uid와 색상을 저장한다
 *
 * @param {string} groupId - 멤버를 추가할 그룹 id
 * @param {string} uid - 추가할 사용자의 uid
 * @returns {Promise<string|null>} 할당된 멤버 색상 (이미 존재하는 멤버라면 null)
 */
export async function addMemberDoc(groupId, uid) {
  try {
    console.log("멤버 추가 실행");

    let groupInfo = await getGroupDocById(groupId);
    if (!groupInfo) throw new Error("존재하지 않는 그룹입니다.");

    if (Object.keys(groupInfo.members).includes(uid)) return null;

    const memberColor = groupInfo.color;

    await updateDoc(doc(db, "groups", groupId), {
      [`members.${uid}`]: memberColor,
      updateAt: serverTimestamp(),
    });

    return memberColor;
  } catch (e) {
    console.error("그룹 문서 멤버 추가 실패 : ", e);
    throw e;
  }
}

/**
 * 그룹 문서와 사용자 문서에서 멤버의 개인 색상을 변경
 *
 * @param {string} groupId - 그룹 id
 * @param {string} uid - 색상을 변경할 사용자의 uid
 * @param {string} color - 변경할 색상 (hex 코드)
 * @returns {Promise<boolean>} 변경 성공 여부
 */
export async function updateMemberColorDoc(groupId, uid, color) {
  try {
    console.log("멤버 색상 변경 실행");

    const batch = writeBatch(db);

    batch.update(doc(db, "groups", groupId), {
      [`members.${uid}`]: color,
      updateAt: serverTimestamp(),
    });
    batch.update(doc(db, "users", uid), {
      [`groupIds.${groupId}`]: color,
      updateAt: serverTimestamp(),
    });

    await batch.commit();
    return true;
  } catch (e) {
    console.error("멤버 색상 변경 실패 : ", e);
    throw e;
  }
}

/**
 * 그룹 문서에서 특정 멤버 삭제
 *
 * members 객체에서 해당 필드를 제거한다.
 *
 * @param {string} groupId - 멤버를 삭제할 그룹 id
 * @param {string} uid - 삭제할 사용자의 uid
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
export async function deleteMemberDoc(groupId, uid) {
  try {
    console.log("그룹 문서 멤버 삭제 실행");

    let groupInfo = await getGroupDocById(groupId);
    if (!groupInfo) throw new Error("존재하지 않는 그룹입니다.");

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
 * 그룹 문서에 등록된 멤버 목록을 조회
 *
 * @param {string} groupId - 멤버 목록을 조회할 그룹 id
 * @returns {Promise<string[]|null>} 멤버 uid 배열
 */
export async function getMemberDocs(groupId) {
  try {
    console.log("그룹 문서 멤버 조회 실행");

    const groupDoc = await getGroupDocById(groupId);
    const members = Object.keys(groupDoc.members);

    console.log(members);

    if (members.length === 0) return null;
    return members;
  } catch (e) {
    console.error("그룹 문서 멤버 조회 실패 : ", e);
    throw e;
  }
}
