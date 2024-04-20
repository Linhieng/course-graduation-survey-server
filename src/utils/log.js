import { sqlAddLoginLog } from '../sql/index.js'
import { getRequestIp } from './index.js'

/**
 * 记录用户相关操作。登录、登出、修改密码
 * @param {TypeID} userId
 * @param {import('express').Request} req
 * @param {string} info
 */
export function userActionLog(userId, req, info) {
    const userAgent = req.headers['user-agent']
    const origin = req.headers['origin']
    const referer = req.headers['referer']
    const platform = ''
    // 只记录，无需处理报错。所以不用 await
    sqlAddLoginLog(userId, getRequestIp(req), userAgent, info, origin, referer, platform)
}
