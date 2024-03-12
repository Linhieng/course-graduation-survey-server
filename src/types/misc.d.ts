/**
 * @file 不知道写在哪里好的类型，就写在这个文件中
 */

/**
 * 主要是为 useOneConn() 函数中的参数提供类型注释，返回值不重要，但一定得是 promise
 * 因为会用到 async
 */
type CallbackFn = (connection: MysqlPoolConnection) => Promise<any>

/**
 * 主要为 asyncHandling 服务，为 req, res, next 提供类型提示
 */
type RequestHandler = import('express-serve-static-core').RequestHandler
