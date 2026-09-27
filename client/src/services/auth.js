/*
=================================
회원 인증 관리 (이름/이메일/비밀번호)

1. 회원가입
  - signUp(name, email, password) - DB 연동 완료
2. 로그인
  - signIn(email, password) - 기초 기능 완료
3. 로그아웃
  - logOut() - 기초 기능 완료
4. 회원 정보 조회
  - getUserInfo(uid) - 기초 기능 완료
=================================
*/

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { auth } from "../../app.js";
import { createUserDoc, getUserDoc } from "../repository/auth_repository.js";

// 회원가입
export async function signUp(name, email, password) {
    try {
        // 입력값 유효성 검사
        if (
            email.trim() === "" ||
            password.trim() === "" ||
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

        createUserDoc(user.uid, user.email, name);

        return user;
    } catch (error) {
        if (error.code === "auth/email-already-in-use") {
            console.error("이미 등록된 사용자", error);
        } else {
            console.error("회원가입 실패!");
            console.error(error);
        }

        throw error;
    }
}

// 로그인
export async function signIn(email, password) {
    let user = auth.currentUser;
    if (user) {
        throw "이미 로그인 된 사용자";
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
    } catch (error) {
        if (error.code === "auth/missing-password") {
            console.error("로그인 실패 : 비밀번호 미입력");
        } else if (error.code === "auth/weak-password") {
            console.error("로그인 실패 : 너무 약한 비밀번호");
        } else {
            console.error("로그인 실패", error);
        }

        throw error;
    }
}

//로그아웃
export async function logOut() {
    try {
        signOut(auth);
        console.log(`로그아웃 성공!`);
        // todo : 로그아웃 후 로그인 페이지로 이동
    } catch (error) {
        console.error("로그아웃 실패", error);
    }
}

// 사용자 정보 조회
export async function getUserInfo() {
    const user = auth.currentUser;
    try {
        const userData = await getUserDoc(user.uid);
        if (userData === null) {
            return null;
        } else {
            const userInfo = { name: userData.name, email: userData.email };
            return userInfo;
        }
    } catch (e) {
        console.error("사용자 조회 실패", e);
    }
}
