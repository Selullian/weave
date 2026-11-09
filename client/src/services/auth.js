/**
 * =================================
 * 회원 인증 관리
 *
 * 1. 회원가입
 *    - signUp(name, email, password)
 * 2. 로그인
 *    - signIn(email, password)
 * 3. 로그아웃
 *    - logOut()
 * 4. 사용자 정보 조회
 *    - getUserInfo()
 * 5. 사용자 그룹 목록 조회
 *    - getUserGroupIds()
 * 6. 회원 정보 수정
 *    - updateUserInfo({ name, groupInfo, removeGroupId })
 *
 * =================================
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { auth } from "../../app.js";
import {
  createUserDoc,
  getUserDoc,
  updateUserInfoDoc,
  //getAuthenticatedUser,
} from "../repository/auth_repository.js";
import { ok, fail, requiredUid } from "./common.js";

/**
 * 회원가입
 *
 * 이메일과 비밀번호를 사용하여 firebase auth에 회원을 등록하고,
 * 생성된 uid를 기준으로 firestore에 회원 문서를 생성한다.
 *
 * @param {string} name - 회원 이름
 * @param {string} email - 회원 이메일
 * @param {string} password - 회원 비밀번호
 * @returns {Promise<Object>} 회원가입 결과
 */
export async function signUp(name, email, password) {
  try {
    // 입력값 유효성 검사
    if (
      !email ||
      email.trim() === "" ||
      !password ||
      password.trim() === "" ||
      !name ||
      name.trim() === ""
    ) {
      return fail({ code: 400, message: "모든 항목을 입력해주세요." });
    }

    // firebase 회원가입 요청
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    // 생성된 사용자 정보
    const user = userCredential.user;
    console.log("회원가입 auth 성공!");

    // firestore 회원 문서 생성
    await createUserDoc(user.uid, user.email, name);

    return ok(user);
  } catch (e) {
    if (e.code === "auth/email-already-in-use") {
      console.error("이미 등록된 사용자입니다.", e);
    } else {
      console.error("회원가입 실패!", e);
    }

    return fail(e);
  }
}

/**
 * 로그인
 *
 * 이메일과 비밀번호를 사용하여 firebase authentication 로그인을 진행한다.
 * 이미 로그인된 사용자가 있는 경우 로그인을 중단한다.
 *
 * @param {string} email - 회원 이메일
 * @param {string} password - 회원 비밀번호
 * @returns {Promise<Object>} 로그인 결과
 */
export async function signIn(email, password) {
  const currentUser = auth.currentUser;
  if (currentUser) {
    return fail({ code: 400, message: "이미 로그인 되어있습니다." });
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const user = userCredential.user;
    console.log("로그인 성공!");

    return ok(user);
  } catch (e) {
    if (e.code === "auth/missing-password") {
      console.error("로그인 실패 : 비밀번호 미입력");
    } else if (e.code === "auth/weak-password") {
      console.error("로그인 실패 : 너무 약한 비밀번호");
    } else {
      console.error("로그인 실패", e);
    }
    return fail(e);
  }
}

/**
 * 로그아웃
 *
 * 현재 로그인된 사용자를 로그아웃한다.
 * 로그인 상태가 아닌 경우 로그아웃을 중단한다.
 *
 * @returns {Promise<Object>} 로그아웃 결과
 */
export async function logOut() {
  try {
    const user = auth.currentUser;
    if (!user) {
      return fail({ code: 400, message: "로그인 상태가 아닙니다." });
    }

    await signOut(auth);
    console.log(`로그아웃 성공!`);
    return ok(true);
  } catch (e) {
    console.error("로그아웃 실패", e);
    return fail(e);
  }
}

/**
 * 사용자 정보 조회
 *
 * 현재 로그인된 사용자의 uid를 확인하고,
 * 해당 uid를 기준으로 회원 정보를 조회한다.
 *
 * @returns {Promise<Object>} 사용자 이름, 이메일, 그룹 목록을 포함한 조회 결과
 */
export async function getUserInfo() {
  try {
    const user = getAuthenticatedUser();

    const userData = await getUserDoc(user.uid);
    if (!userData) {
      return ok(null);
    }

    return ok({
      name: userData.name,
      email: userData.email,
      groupIds: userData.groupIds,
    });
  } catch (e) {
    console.error("사용자 정보 조회 실패:", e.message);
    return fail(e);
  }
}

/**
 * 사용자 그룹 목록 조회
 *
 * 현재 로그인된 사용자의 uid를 확인하고,
 * 문서에 저장된 그룹 아이디와 캘린더 색상 정보를 조회한다.
 *
 * @returns {Promise<Object>} 그룹 아이디와 색상 정보를 포함한 조회 결과
 */
export async function getUserGroupIds() {
  try {
    const user = getAuthenticatedUser();

    const userData = await getUserDoc(user.uid);
    if (!userData) {
      return ok(null);
    }

    // 그룹 정보 반환
    return ok(userData.groupIds);
  } catch (e) {
    console.error("사용자의 그룹 목록 조회 실패:", e.message);
    return fail(e);
  }
}

/**
 * 회원 정보 수정
 *
 * 현재 로그인된 사용자의 uid를 확인하고,
 * 사용자 이름 및 그룹 정보를 수정한다.
 * 그룹 정보는 추가, 색상 변경 또는 삭제할 수 있다.
 *
 * @param {Object} params - 회원 정보 수정에 필요한 매개변수
 * @param {string|null} [params.name=null] - 변경할 사용자 이름
 * @param {Object.<string, string>|null} [params.groupInfo=null] - 추가 혹은 변경할 그룹 정보 (그룹 아이디: 색상)
 * @param {string|null} [params.removeGroupId=null] - 삭제할 그룹 아이디
 * @returns {Promise<Object>} 회원 정보 수정 결과
 */
export async function updateUserInfo({
  name = null,
  groupInfo = null,
  removeGroupId = null,
} = {}) {
  try {
    console.log("회원 정보 수정 실행");
    if (!name && !groupInfo && !removeGroupId) {
      console.warn("수정할 정보가 없습니다.");
      return ok(null);
    }

    const uid = requiredUid();

    const isSuccess = await updateUserInfoDoc({
      uid,
      name,
      groupInfo,
      removeGroupId,
    });
    return ok(isSuccess);
  } catch (e) {
    console.error("회원 정보 수정 실패 : ", e);
    return fail(e);
  }
}
