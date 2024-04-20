import { STATUS_SUCCEED } from '../constants/index.js'

/**
 * 获取客户端IP地址
 * 客户请求的IP地址存在于request对象当中
 * express框架可以直接通过 req.ip 获取
 *
 * @param {import('express').Request} req 传入请求HttpRequest
 */
export function getRequestIp(req) {
    /** @type {string} */
    let ip = req.headers['x-forwarded-for'] ||
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress ||
        ''

    if (ip === '::1') return '127.0.0.1'
    if (ip.startsWith('::ffff:')) return ip.slice(7)
    return ip
}


/**
 * 响应数据时，统一调用该函数来生成一个响应对象模板。
 * 默认内容为成功响应
 *
 * @param {TypeResStatus} status
 * @param {TypeResCode} code
 * @param {string} msg
 * @param {T extends Object} data
 * @returns {ResWrapper<T>}
 */
export function getRespondData(status = STATUS_SUCCEED, code = 0, msg = '无', data = {}) {
    const resData = { status, code, msg, data }
    return resData
}
