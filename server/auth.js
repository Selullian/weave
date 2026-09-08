//===========================
//      이메일/비밀번호
//      회원 관리 기능
//===========================

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../client/app";
import { toQueryRef } from "firebase/data-connect";

// 회원가입 (인증, 이메일, 비번)
export async function signUp(email, password) {
    try {
        if (email.isEmpty() || password.isEmpty()) {
            throw ErrorEvent("모든 항목을 입력해주세요");
        }
        createUserWithEmailAndPassword(auth, email, password).then(
            (userCredential) => {
                // Signed up
                const user = userCredential.user;
            },
        );
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
    }
}

// 로그인 기능
export function signIn(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            // ...
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
        });
}
