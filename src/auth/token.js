import { CODE_FAILED } from '../constants/response.js'
import { getRespondData } from '../utils/generate.js'
import { jwtSign, jwtVerify } from './index.js'

/**
 * 根据 userId 和 username 生成 token 并放入到 cookie 中
 *
 * @param {ExpressResponse} res
 * @param {string} userId
 * @param {string} username
 */
export function signAuth(res, userId, username) {
    const token = jwtSign(userId, username)

    res.cookie('token', token, {sameSite:'none', secure: true})
    res.cookie('userId', userId, {sameSite:'none', secure: true})
    res.cookie('username', username, {sameSite:'none', secure: true})
}

/**
 * 中间件：验证 cookie 是否过期
 *
 * @param {ExpressRequest} req
 * @param {ExpressResponse} res
 * @param {ExpressNextFunction} next
 */
export function midVerifyAuth(req, res, next) {
    /** @type {AuthObj} */
    const cookies = req.cookies
    const { token, userId, username } = cookies
    const isError = jwtVerify(token, Number.parseInt(userId), username)
    if (!isError) {
        next()
    } else if (isError === 1) {
        res.status(401).send(getRespondData(
            'failed',
            CODE_FAILED,
            '凭据已过期',
        ))
    } else {
        res.status(401).send(getRespondData(
            'failed',
            CODE_FAILED,
            '未获得授权',
        ))
    }
}
