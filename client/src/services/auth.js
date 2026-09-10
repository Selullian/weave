// =================================
//
//   회원 인증 관리 (이메일/비밀번호)
//
// =================================

// Firebase Authentication 기능 가져오기
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { auth } from "../../app.js";

// 회원가입
export async function signUp(email, password) {
    try {
        // 입력값 유효성 검사
        if (email.trim() === "" || password.trim() === "") {
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

        console.log("회원가입 성공!");

        return user;
    } catch (error) {
        if (error.code === "auth/email-already-in-use") {
            console.error("이미 등록된 사용자", error);
        } else {
            console.error("회원가입 실패!");
            console.error(error);
        }

        throw error.code;
    }
}

// 로그인
export async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password,
        );

        const user = userCredential.user;

        console.log("로그인 성공!");
        console.log("UID:", user.uid);
        console.log("이메일:", user.email);

        return user;
    } catch (error) {
        console.error("로그인 실패!");
        console.error("에러 코드:", error.code);
        console.error("에러 메시지:", error.message);

        throw error;
    }
}
