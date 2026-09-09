//===========================
//
//      이메일/비밀번호
//      회원 관리 기능
//
//===========================

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "../../app.js";

// 회원가입
export async function signUp(email, password) {
    try {
        if (email.trim() === "" || password.trim() === "") {
            throw new Error("모든 항목을 입력해주세요.");
        }

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
        );

        const user = userCredential.user;

        console.log("회원가입 성공!");
        console.log("UID:", user.uid);
        console.log("이메일:", user.email);

        return user;
    } catch (error) {
        console.error("회원가입 실패!");
        console.error("에러 코드:", error.code);
        console.error("에러 메시지:", error.message);

        throw error;
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
