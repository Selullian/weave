import { ok, fail, requiredUid } from "../services/common.js";
import { getUserGroupIds } from "../services/auth.js";
import {
    createGroupDoc,
    getGroupDoc,
    getUserGroupDocs,
} from "../repository/group_repository.js";

/*
===================================
그룹 관리
-----------------------
그룹 생성
- createGroup({name, description, color}) - 구현 완료
그룹 조회
- getUserGroups(uid) - 구현 전
그룹 정보 조회
- getGroupInfo(groupId) - 구현 전
그룹 정보 수정
그룹 삭제
멤버 추가
멤버 조회
멤버 삭제
멤버 별 그룹 색상 변경
멤버 별 그룹 색상 조회



===================================
*/

// 1. 그룹 생성
export async function createGroup({ name, description, color }) {
    try {
        if (!name || !description || !color) {
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

// 그룹 정보 조회
export async function getGroupInfo(groupId) {
    try {
        if (!groupId) {
            return fail({
                code: 400,
                message: "필수 입력 항목을 확인해주세요.",
            });
        }
        let groupInfo = await getGroupDoc(groupId);
        if (groupInfo === null) {
            return fail({ code: 400, message: "존재하지 않는 그룹id입니다." });
        }

        return ok(groupInfo);
    } catch (e) {
        console.error("그룹 정보 조회 실패 : ", e);
        return fail(e);
    }
}

// 사용자의 특정 그룹 조회
export async function getGroupById(groupId) {
    try {
        console.log("특정 그룹 조회 실행");

        let result = await getGroupById(groupId);
        if (result === null)
            return fail({ code: 400, message: "존재하지 않는 그룹입니다." });

        return ok(result);
    } catch (e) {
        console.error("특정 그룹 조회 실패 : ", e);
        return fail(e);
    }
}

// 시용자의 모든 그룹 조회
export async function getUserGroups() {
    try {
        let uid = requiredUid();

        let result = await getUserGroupDocs(uid);

        return ok(result);
    } catch (e) {
        console.error("모든 그룹 조회 실패 : ", e);
        return fail(e);
    }
}
