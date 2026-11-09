import {
    ok,
    fail,
    requiredUid,
    getToUpdateContent,
} from "../services/common.js";
import {
    getUserGroupIds,
    getUserInfo,
    updateUserInfo,
} from "../services/auth.js";
import {
    createGroupDoc,
    getGroupDocById,
    getUserGroupDocs,
    updateGroupDoc,
    deleteGroupDoc,
    addMemberDoc,
    deleteMemberDoc,
    isExistGroup,
    getMemberDocs,
} from "../repository/group_repository.js";

/*
===================================
그룹 관리
-----------------------
1. 그룹 생성
   - createGroup({name, description, color})
2. 단일 그룹 정보 조회
   - getGroupInfo(groupId)
3. 사용자 그룹 조회
   - getUserGroups()
4. 그룹 정보 수정
   - updateGroup(groupId, contents)
5. 그룹 삭제
   - deleteGroup(groupId)
6. 그룹 멤버 추가
   - addMember(groupId)
7. 그룹 멤버 삭제
   - deleteMember(groupId)
8. 그룹 멤버 목록 조회
   - getMembers(groupId)
===================================
*/

/**
 * 그룹 생성
 *
 * 필수 입력값을 검증하고 현재 로그인한 사용자를 그룹 소유자로 지정하여
 * 새로운 그룹 문서를 생성한다.
 *
 * @param {Object} params - 그룹 생성에 필요한 정보
 * @param {string} params.name - 그룹 이름
 * @param {string} params.description - 그룹 설명
 * @param {string} params.color - 그룹 대표 색상 (hex 코드)
 * @returns {Promise<Object>} 그룹 생성 결과 (성공 또는 실패 응답)
 */
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

/**
 * 단일 그룹 정보 조회
 *
 * 그룹 id를 기준으로 특정 그룹의 상세 정보를 조회한다.
 *
 * @param {string} groupId - 조회할 그룹 id
 * @returns {Promise<Object>} 그룹 정보 또는 조회 실패 응답
 */
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

        // 그룹 문서가 없으면 null 반환
        return ok(groupInfo);
    } catch (e) {
        console.error("그룹 정보 조회 실패 : ", e);
        return fail(e);
    }
}

/**
 * 사용자 그룹 조회
 *
 * 현재 로그인한 사용자의 uid를 기준으로
 * 사용자가 소속된 모든 그룹 정보를 조회한다.
 *
 * @returns {Promise<Object>} 사용자 그룹 목록 또는 조회 실패 응답
 */
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

/**
 * 그룹 정보 수정
 *
 * 그룹 존재 여부와 로그인 상태를 확인한 후
 * 실제 변경이 필요한 항목만 추출하여 그룹 정보를 수정한다.
 *
 * @param {string} groupId - 수정할 그룹 id
 * @param {Object} contents - 수정할 그룹 정보
 * @returns {Promise<Object>} 수정 결과 (성공 또는 실패 응답)
 */
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

        return ok(true);
    } catch (e) {
        console.error("그룹 수정 실패", e);
        return fail(e);
    }
}

/**
 * 그룹 삭제
 *
 * 그룹 id를 기준으로 그룹 존재 여부를 확인한 후
 * 해당 그룹 문서를 삭제한다.
 *
 * @param {string} groupId - 삭제할 그룹 id
 * @returns {Promise<Object>} 삭제 결과 (성공 또는 실패 응답)
 */
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

/**
 * 그룹 멤버 추가
 *
 * 현재 로그인한 사용자를 그룹의 멤버로 추가한다.
 * 그룹 문서에 멤버 uid와 개인 색상을 저장하고,
 * 사용자 문서의 groupIds에도 그룹 정보를 추가한다.
 *
 * @param {string} groupId - 멤버를 추가할 그룹 id
 * @returns {Promise<Object>} 멤버 추가 결과 (성공 또는 실패 응답)
 */
export async function addMember(groupId) {
    try {
        console.log("멤버 추가 실행");

        if (!groupId)
            return fail({ code: 400, message: "그룹 아이디를 입력해주세요." });

        const uid = requiredUid();

        // 그룹 문서에 멤버 정보 추가 (이미 멤버라면 null 반환)
        let memberColor = await addMemberDoc(groupId, uid);

        if (!memberColor) {
            return fail({ code: 409, message: "이미 그룹의 멤버입니다." });
        }

        // 사용자 문서의 groupIds에 그룹 id와 색상 추가
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
 * 그룹 멤버 삭제
 *
 * 현재 로그인한 사용자를 그룹에서 삭제한다.
 * 그룹 문서의 members와 사용자 문서의 groupIds에서
 * 해당 그룹 정보를 각각 제거한다.
 *
 * @param {string} groupId - 탈퇴할 그룹 id
 * @returns {Promise<Object>} 멤버 삭제 결과 (성공 또는 실패 응답)
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

/**
 * 그룹 멤버 목록 조회
 *
 * 그룹 존재 여부와 현재 로그인한 사용자의 그룹 소속 여부를 확인한 후
 * 해당 그룹에 등록된 모든 멤버 uid 목록을 조회한다.
 *
 * @param {string} groupId - 멤버 목록을 조회할 그룹 id
 * @returns {Promise<Object>} 그룹 멤버 uid 목록 또는 조회 실패 응답
 */
export async function getMembers(groupId) {
    try {
        console.log("멤버 목록 조회 실행");

        if (!groupId)
            return fail({
                code: 400,
                message: "필수 입력 사항을 확인해주세요.",
            });

        const uid = requiredUid();

        // 그룹 존재 여부 확인
        let isExist = await isExistGroup(groupId);

        if (!isExist)
            return fail({ code: 400, message: "존재하지 않는 그룹입니다." });

        // 현재 사용자의 그룹 소속 여부 확인
        const userGroups = await getUserGroupIds(uid);

        if (!Object.keys(userGroups).includes(groupId))
            throw new Error("그룹의 멤버가 아닙니다.");

        // 그룹 멤버 uid 목록 조회
        const memberList = await getMemberDocs(groupId, uid);

        return ok(memberList);
    } catch (e) {
        console.error("멤버 목록 조회 실패 : ", e);
        return fail(e);
    }
}
