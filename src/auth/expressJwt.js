import { expressjwt } from 'express-jwt'
import { JWT_SECRET } from '../constants/jwt.js'
import fs from 'node:fs'

/**
 * 添加 token 黑名单
 * @param {jwtAuth} jwtAuth
 */
export const addRevokedToken = (jwtAuth) => {
    fs.appendFileSync('src/auth/revokedToken', `${jwtAuth.exp};${jwtAuth.iat};${jwtAuth.userId}\n`, 'utf8')
}

/**
 *
 * @param {*} req
 * @param {jwtAuth} token
 * @returns
 */
const isRevokedCallback = async (req, token) => {
    const exp = token.payload.exp
    const iat = token.payload.iat
    const userId = token.payload.userId

    const data = fs.readFileSync('src/auth/revokedToken', 'utf8')
    return data.indexOf(`${exp};${iat};${userId}`) !== -1
}


/**
 *
 * @param {Express} app
 */
export function useExpressJwt(app) {
    app.use(expressjwt({
        algorithms: ['HS256'],
        secret: JWT_SECRET,  // 签名的密钥 或 PublicKey
        isRevoked: isRevokedCallback,
    }).unless({
        path: [ // 指定路径不经过 Token 解析
            '/api/user/login',
            '/api/user/signup',
            {
                url: /^\/api\/answer\/.*/,
                methods: ['GET', 'POST'],
            },
        ],
    }))
}
