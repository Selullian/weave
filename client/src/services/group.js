import { auth } from "../../app.js";
import { createGroupDoc } from "../repository/group_repository.js";
import { getUserGroupIds } from "../services/auth.js";

/*
===================================
그룹 관리
-----------------------
그룹 생성
- createGroup({name, description, color}) - 구현 완료
그룹 조회
- getGroups() - 구현 전
그룹 정보 조회
- getGroup(groupId) - 구현 전
그룹 정보 수정
그룹 삭제
멤버 추가
멤버 조회
멤버 삭제
멤버 별 그룹 색상 변경
멤버 별 그룹 색상 조회



===================================
*/

const ok = (data) => {
    return { success: true, data: data };
};
const fail = (e) => {
    return { success: false, error: { code: e.code, message: e.message } };
};

function requiredUid() {
    const user = auth.currentUser;
    if (!user) throw new Error("로그인이 필요합니다.");
    return user.uid;
}

// 1. 그룹 생성
export async function createGroup({ name, description, color }) {
    try {
        if (name && description && color) {
            return fail({
                code: 400,
                message: "필수 항목을 모두 입력해주세요.",
            });
        }

        let uid = requiredUid();

        let docs = await createGroupDoc({
            name: name,
            description: description,
            color: color,
            ownerId: uid,
        });
        console.log("그룹 생성 성공!", docs);

        return ok(docs);
    } catch (e) {
        console.error("그룹 생성 실패 : ", e);
        return fail(e);
    }
}
