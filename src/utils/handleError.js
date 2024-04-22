import { CODE_ERROR, CODE_UNKNOWN_ERROR } from '../constants/response.js'
import { getRespondData } from './generate.js'

/**
 * 路由时如果使用 async，则需要使用该函数进行包裹，目的是为了将异步中的错误抛给默认错误处理中间件处理
 * 只考虑三个参数 req, res, next 的情况。
 * 注意：在 express@5 中原生支持捕获异步错误，但目前使用的还是 express@4
 *
 * @param {RequestHandler} requesthandler
 * @returns
 */
export const asyncHandler = requesthandler => (req, res, next) => {
    return Promise
        .resolve(requesthandler(req, res, next))
        .catch(next)
}

/**
 * 全局默认错误处理
 * @param {any} err
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */
export function defaultHandler(err, req, res, _next) {
    if (err.name === 'UnauthorizedError') {
        // 无效的 token
        const resData = getRespondData('failed', CODE_ERROR, 'api.error.token-invalid')
        res.status(403).send(resData)
        return
    }

    // 自定义错误
    if (err instanceof SqlError) {
        const resData = getRespondData('failed', CODE_ERROR, err.msg)
        res.status(err.status).send(resData)
    }
    if (err instanceof Error4xx) {
        const resData = getRespondData('failed', CODE_ERROR, err.msg)
        res.status(err.statusCode).send(resData)
    }

    console.error(err)
    // api.error.default.unknown
    const resData = getRespondData('failed', CODE_UNKNOWN_ERROR, 'api.error.default.unknown')
    if (err.__explain) {
        resData.code = CODE_ERROR
        resData.msg = err.__explain
    }
    res.status(500).send(resData)
}

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
export class SqlError extends Error {
    constructor(status, msg) {
        super('sql 错误: ' + msg)
        this.status = status
        this.msg = msg
    }
}
export class Error4xx extends Error {
    constructor(statusCode, msg) {
        super('客户端参数错误 400: ' + msg)
        this.statusCode = statusCode
        this.msg = msg
    }
}
