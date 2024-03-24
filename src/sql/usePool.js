import mysql from 'mysql2/promise'

/**
 * 连接池变量，启动时应该对其赋值
 *
 * @type {MysqlPool}
 */
let connPool

/**
 * 初始化一个连接池
 *
 * @param {DatabaseConfig} param
 */
export function initConnPool({host, user, password, database}) {
    try {
        connPool = mysql.createPool({ host, user, password, database })
    } catch (error) {
        error.__explain = '创建 mysql 连接池失败'
        throw error
    }
}

/**
 * 使用单个数据库连接执行异步操作，操作完成后会自动释放
 *
 * @param {CallbackFn} cb - 要执行的异步操作函数，接受一个数据库连接对象作为参数。
 */
export async function useOneConn(cb) {
    try {
        const connection = await connPool.getConnection()
        const result = await cb(connection)
        connection.release()
        return result
    } catch (error) {
        /** @type {MysqlError} */
        let err = error
        if (err.code === 'ER_MALFORMED_PACKET') {
            error.__explain = 'ER_MALFORMED_PACKET：代码中 sql 代码编写错误'
        } else if (err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
            error.__explain = 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD：代码中 sql 代码编写错误'
        }

        throw error
    }
}

/**
 * 返回一条连接，需要自己手动进行释放！
 *
 * @returns {MysqlPoolConnection}
 */
export async function getOneConn() {
    const connection = await connPool.getConnection()
    return connection
}
