import { STATUS_SUCCEED } from "../constants/index.js"

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
export function getResponData(status = STATUS_SUCCEED, code=0, msg='无', data={}) {
    const resData = { status, code, msg, data }
    return resData
}
