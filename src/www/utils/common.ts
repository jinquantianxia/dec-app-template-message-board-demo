export function randomString(len = 4) {
    const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    const charsLen = chars.length;
    let str = '';
    for (let i = 0; i < len; i++) str += chars.charAt(Math.floor(Math.random() * charsLen));
    return str;
}

export function generateUniqueKey() {
    const timestamp = new Date().getTime();
    const key = `${timestamp}_${randomString()}`;
    return key;
}
