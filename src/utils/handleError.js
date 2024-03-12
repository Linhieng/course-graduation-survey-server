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
export function defaultHandler(err, req, res, next) {
    console.error(err)
    const resData = getResponData('failed', CODE_UNKNOWN_ERROR, '未知错误！请联系网站负责人。')
    if (err.__explain) {
        resData.code = CODE_ERROR
        resData.msg = err.__explain
    }
    res.status(500).send(resData)
}
