import { auth } from "../../app.js";

export function ok(data) {
    return { success: true, data: data };
}
export function fail(e) {
    return { success: false, error: { code: e.code, message: e.message } };
}

export function requiredUid() {
    const user = auth.currentUser;
    if (!user) throw new Error("로그인이 필요합니다.");
    return user.uid;
}

export const toEntity = (doc) => ({
    ...doc.data(),
});

// 변경된 필드만 추출하는 함수
export async function getToUpdateContent(contentId, contents) {
    let originalData = await getDocById(contentId);
    if (originalData) {
        const newData = {
            ...contents,
        };
        const updates = {};
        Object.keys(newData).forEach((key) => {
            if (originalData[key] !== newData[key]) {
                updates[key] = newData[key];
            }
        });

        return updates;
    }
    return null;
}
