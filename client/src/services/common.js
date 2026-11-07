import { auth, db } from "../../app.js";
import {
    getDoc,
    doc,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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
export async function getToUpdateContent(col, contentId, contents) {
    let originalData = await getDoc(doc(db, col, contentId));
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

        if (Object.keys(updates).length === 0) return null;
        return updates;
    }
    return null;
}
