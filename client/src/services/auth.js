/*
=================================
회원 인증 관리 (이름/이메일/비밀번호)

1. 회원가입
  - signUp(name, email, password) - DB 연동 완료
2. 로그인
  - signIn(email, password) - 기초 기능 완료
3. 로그아웃
  - logOut() - 기초 기능 완료
4. 사용자 정보 조회
  - getUserInfo() - 로그인 검증 및 오류 처리 완료
5. 사용자 그룹 목록 조회
  - getUserGroupIds() - 로그인 검증 및 오류 처리 완료
6. 회원 정보 수정
  - updateUserInfo({ name, groupInfo }) - 오류 처리 완료
=================================
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
} from "../repository/auth_repository.js";
import { requiredUid } from "./common.js";

// 현재 로그인된 사용자 획득 및 뷰 검증 헬퍼 함수
function getAuthenticatedUser() {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("로그인이 필요한 서비스입니다.");
    }
    return user;
}

// 회원가입
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
            throw new Error("모든 항목을 입력해주세요.");
        }

        // Firebase 회원가입 요청
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
        );

        // 생성된 사용자 정보
        const user = userCredential.user;
        console.log("회원가입 auth 성공!");

        // DB 유저 문서 생성 비동기 처리
        await createUserDoc(user.uid, user.email, name);

        return user;
    } catch (e) {
        if (e.code === "auth/email-already-in-use") {
            console.error("이미 등록된 사용자입니다.", e);
        } else {
            console.error("회원가입 실패!", e);
        }

        throw e;
    }
}

// 로그인
export async function signIn(email, password) {
    const currentUser = auth.currentUser;
    if (currentUser) {
        throw new Error("이미 로그인 되어 있습니다.");
    }

    try {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password,
        );

        const user = userCredential.user;
        console.log("로그인 성공!");

        return user;
    } catch (e) {
        if (e.code === "auth/missing-password") {
            console.error("로그인 실패 : 비밀번호 미입력");
        } else if (e.code === "auth/weak-password") {
            console.error("로그인 실패 : 너무 약한 비밀번호");
        } else {
            console.error("로그인 실패", e);
        }

        throw e;
    }
}

// 로그아웃
export async function logOut() {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.warn("로그인 상태가 아닙니다.");
            return;
        }

        await signOut(auth);
        console.log(`로그아웃 성공!`);
        // todo : 로그아웃 후 로그인 페이지로 이동
    } catch (e) {
        console.error("로그아웃 실패", e);
        throw e;
    }
}

// 사용자 정보 조회
export async function getUserInfo() {
    try {
        const user = getAuthenticatedUser();

        const userData = await getUserDoc(user.uid);
        if (!userData) {
            return null;
        }

        return { name: userData.name, email: userData.email };
    } catch (e) {
        console.error("사용자 정보 조회 실패:", e.message);
        throw e;
    }
}

// 사용자 그룹 목록 조회
export async function getUserGroupIds() {
    try {
        const user = getAuthenticatedUser();

        const userData = await getUserDoc(user.uid);
        if (!userData) {
            return null;
        }

        return userData.groupIds || [];
    } catch (e) {
        console.error("사용자의 그룹 목록 조회 실패:", e.message);
        throw e;
    }
}

// 회원 정보 수정
export async function updateUserInfo({ name = null, groupInfo = null } = {}) {
    try {
        console.log("회원 정보 수정 실행");
        if (!name && !groupInfo) {
            console.warn("수정할 정보가 없습니다.");
            return null;
        }

        const uid = requiredUid();

        const isSuccess = await updateUserInfoDoc({ uid, name, groupInfo });
        return isSuccess;
    } catch (e) {
        console.error("회원 정보 수정 실패 : ", e);
        throw e;
    }
}
