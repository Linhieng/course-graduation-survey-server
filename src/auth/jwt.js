import { JWT_SECRET } from '../constants/jwt.js'
import jwt from 'jsonwebtoken'

/**
 * 生成一个 token
 *
 * @param {TypeID} userId
 * @param {string} username
 * @param {*} expiresIn 提供数字时，单位是秒。为了方便测试，默认是 1 小时过期。
 * @returns
 */
export function jwtSign(userId, username, expiresIn = 3600) {

    const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn })
    return token

}

/**
 * 返回值表示是否失败。
 *  - 0 为成功；
 *  - 1 为过期；
 *  - 2 为未获得权限；
 *  - 3 为未提供 token
 *
 * @param {string} token
 * @param {TypeID} userId
 * @param {string} username
 * @returns {0 | 1 | 2 | 4} 是否失败
 */
export function jwtVerify(token, userId, username) {

    try {
        /** @type {AuthObj} */
        const payload = jwt.verify(token, JWT_SECRET)
        // TODO: 这里是我自作多情了吗？
        const isValid = userId === payload.userId && username === payload.username
        if (isValid) return 0
        return 2
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return 1
        }
        if (error.name === 'JsonWebTokenError' && error.message === 'jwt must be provided') {
            return 3
        }
        error.explain = 'jwt 鉴权时发生未知错误'
        throw error
    }

}
