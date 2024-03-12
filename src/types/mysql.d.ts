/**
 * mysql2 连接池类型
 */
type MysqlPool = import('mysql2/promise').Pool

/**
 * mysql2 连接类型
 */
type MysqlPoolConnection = import('mysql2/promise').PoolConnection

/**
 * mysql2 中进行操作（如 insert）后，第一个参数就是该类型
 */
type MysqlResultSetHeader = import('mysql2/promise').ResultSetHeader

/**
 * mysql2 中报错时的类型。添加在这里主要是因为没有找到对于的类型，所以只能自己定义。
 */
interface MysqlError {
    code: string | 'ER_MALFORMED_PACKET'
    errno: number | 1835
    message: string | 'Malformed communication packet.'
    /**
     * 执行报错的 sql 语句
     */
    sql: string
    sqlMessage: string | 'Malformed communication packet.'
    sqlState: string | 'HY000'
}

/**
 * 连接 mysql 时所需要的基本配置。还有更多配置可选，但目前只用到这些配置项
 */
interface DatabaseConfig {
    /**
     * - 数据库主机名，如 localhost
     */
    host: string
    /**
     * - 数据库用户名，如 root
     */
    user: string
    /**
     * - 数据库密码
     */
    password: string
    /**
     * - 数据库名称
     */
    database: string
}
