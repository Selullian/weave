import { db } from "../../app.js";
import {
    setDoc,
    getDoc,
    doc,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/*
=================================
회원 인증 관리 (이름/이메일/비밀번호)

1. 회원 문서 생성
  - createUserDoc(uid, email, name) - 기초 기능 완료
2. 회원 정보 조회
  - getUserDoc(uid) - 기초 기능 완료
3. 회원명 수정 - 구현 전

todo |

=================================
*/

/* Users
 ┌────────────┬───────────┬──────────────────────────────────────────────
 │ 필드         타입         용도
 ├────────────┼───────────┼──────────────────────────────────────────────
 │ uid        │ string    │ doc ID로 사용. Firebase Auth의 UID와 동일하며,
 │            │           │ 사용자를 특정할 때 기준이 되는 값
 ├────────────┼───────────┼──────────────────────────────────────────────
 │ name       │ string    │ 그룹원 목록 조회 시 이름 표시
 │            │           │ 그룹 초대 시 사용자 검색 결과에 표시
 ├────────────┼───────────┼──────────────────────────────────────────────
 │ email      │ string    │ 회원가입·로그인 수단
 │            │           │ 그룹 초대 시 ID로 사용자를 검색
 ├────────────┼───────────┼──────────────────────────────────────────────
 │ groupIds   │ map       │ 내가 속한 그룹 목록을 한 번에 가져오기 위한 필드
 │            │           │ 좌측 그룹 목록 렌더링 및 통합 캘린더의
 │            │           │ 표시 그룹 선택 체크박스 목록 구성에 사용, keys()
 |            |           | 
 │            │           │ 내가 각 그룹에 지정한 캘린더 표시 색상
 │            │           │ { groupId: "#hex" } 형태로 저장
 │            │           │ 통합 캘린더에서 그룹별 색상으로 일정을
 │            │           │ 렌더링할 때 참조
 └────────────┴───────────┴──────────────────────────────────────────────
*/

// 회원 문서 생성
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
    } catch (e) {
        console.error("Document 생성 오류 : ", e);
    }
}

// 회원 정보 조회
export async function getUserDoc(uid) {
    try {
        console.log("uid로 회원 정보 조회 실행");
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        // 문서 존재 분기
        if (docSnap.exists()) {
            const userData = docSnap.data();
            return userData;
        } else {
            return null;
        }
    } catch (e) {
        console.error("DB 사용자 조회 실패 : ", e);
    }
}
