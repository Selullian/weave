import {
    ok,
    fail,
    requiredUid,
    getToUpdateContent,
} from "../services/common.js";
import { getUserInfo, updateUserInfo } from "../services/auth.js";
import {
    createGroupDoc,
    getGroupDocById,
    getUserGroupDocs,
    updateGroupDoc,
    deleteGroupDoc,
    addMemberDoc,
    deleteMemberDoc,
    isExistGroup,
} from "../repository/group_repository.js";

/*
===================================
그룹 관리
-----------------------
그룹 생성
- createGroup({name, description, color}) - 구현 완료
그룹 조회
- getUserGroups(uid) - 구현 완료
그룹 정보 조회
- getGroupInfo(groupId) - 구현 완료
그룹 정보 수정
- updateGroup() - 구현 완료
그룹 삭제
- deleteGroup() - 구현 완료
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
        console.log("그룹 생성 실행");

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

// 단일 그룹 정보 조회
export async function getGroupInfo(groupId) {
    try {
        console.log("특정 그룹 조회 실행");
        if (!groupId) {
            return fail({
                code: 400,
                message: "필수 입력 항목을 확인해주세요.",
            });
        }
        let groupInfo = await getGroupDocById(groupId);

        // 없으면 null
        return ok(groupInfo);
    } catch (e) {
        console.error("그룹 정보 조회 실패 : ", e);
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

// 그룹 정보 수정 { name, description, color, membersColor }
export async function updateGroup(groupId, contents) {
    try {
        console.log("그룹 수정 실행");
        if (!groupId || !contents)
            return fail({
                code: 400,
                message: "필수 입력 사항을 확인해주세요.",
            });

        requiredUid();
        if (!(await isExistGroup(groupId))) {
            return fail({
                code: 400,
                message: "수정할 그룹이 존재하지 않습니다.",
            });
        }

        const updateField = await getToUpdateContent(
            "groups",
            groupId,
            contents,
        );

        if (!updateField) {
            console.warn("변경된 항목이 없습니다.");
            return fail({ code: 400, message: "변경된 항목이 없습니다." });
        }

        await updateGroupDoc(groupId, updateField);

        // 성공 시 true
        return ok(true);
    } catch (e) {
        console.error("그룹 수정 실패", e);
        return fail(e);
    }
}

// 그룹 삭제
export async function deleteGroup(groupId) {
    try {
        console.log("그룹 삭제 실행");

        if (!groupId) {
            return fail({ code: 400, message: "필수 항목을 입력해주세요" });
        } else if (!(await isExistGroup(groupId))) {
            return fail({
                code: 400,
                message: "삭제할 그룹이 존재하지 않습니다.",
            });
        }
        let result = await deleteGroupDoc(groupId);

        if (result) return ok(result);
        else return fail({ code: 400, message: "존재하지 않는 그룹입니다." });
    } catch (e) {
        console.error("그룹 삭제 실패: ", e);
        return fail(e);
    }
}

// 멤버 추가
export async function addMember(groupId) {
    try {
        console.log("멤버 추가 실행");
        if (!groupId)
            return fail({ code: 400, message: "그룹 아이디를 입력해주세요." });

        const uid = requiredUid();

        // 그룹 문서에 멤버 추가 (이미 멤버면 null, 성공하면 배정된 색상 반환)
        let memberColor = await addMemberDoc(groupId, uid);
        if (!memberColor) {
            return fail({ code: 409, message: "이미 그룹의 멤버입니다." });
        }

        // 회원 문서의 groupIds에 {groupId: color} 추가
        let groupInfo = {};
        groupInfo[groupId] = memberColor;

        await updateUserInfo({ groupInfo: groupInfo });

        return ok(true);
    } catch (e) {
        console.error("멤버 추가 실패 : ", e);
        return fail(e);
    }
}

/**
 * 그룹에서 멤버 삭제
 * @param {String} groupId
 * @returns 성공 여부 boolean
 */
export async function deleteMember(groupId) {
    try {
        console.log("멤버 삭제 실행");

        if (!groupId)
            return fail({ code: 400, message: "필수 항목을 확인해주세요." });

        const uid = requiredUid();

        const deletedAtGroup = await deleteMemberDoc(groupId, uid);
        if (!deletedAtGroup) {
            return fail({ code: 400, message: "멤버 삭제 실패" });
        }

        const deletedAtUser = await updateUserInfo({ removeGroupId: groupId });
        if (!deletedAtUser)
            return fail({ code: 400, message: "멤버 삭제 실패" });

        return ok(true);
    } catch (e) {
        console.error("멤버 삭제 실패 : ", e);
        return fail(e);
    }
}
