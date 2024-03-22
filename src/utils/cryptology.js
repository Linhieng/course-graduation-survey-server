import CryptoJS from 'crypto-js'


/**
 * 返回经过 SHA256 加密后的字符串
 *
 * @param {string} str 待加密的字符串
 * @returns {string} 经过 SHA256 加密后的字符串
 */
export function encrypt(str) {
    const encryptedPassword = CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex)
    return encryptedPassword
}
