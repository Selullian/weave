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
