import { useOneConn } from './index.js'

/**
 * 根据 username 在 user 表中进行查找对于的密码
 *
 * @param {string} username
 * @returns {Promise<[] | SchemaUser[]>} 不存在则返回空数组，存在则返回 SchemaUser
 */
export const selectPasswordByUsername = (username) => useOneConn(async (conn) => {
    const sql = 'SELECT * FROM `user` WHERE `username` = ? LIMIT 1'
    const values = [username]

    const [rows] = await conn.execute(sql, values)

    return rows
})

/**
 * 添加一个普通用户
 *
 * @param {string} username - 用户名
 * @param {string} password_hash - 加密后的密码
 * @returns {Promise<'existed' | MysqlResultSetHeader>} 如果用户名已存在，则返回 false
 */
export const insertOne = (username, password_hash) => useOneConn(async (conn) => {

    let sql = 'SELECT * FROM `user` WHERE `username` = ? LIMIT 1'
    let values = [username]
    let result = await conn.execute(sql, values)
    if (result[0].length > 0) {
        return 'existed'
    }

    sql = 'INSERT INTO `user`(`username`, `password_hash`) VALUE (?, ?)'
    values = [username, password_hash]
    result = await conn.execute(sql, values)
    return result[0]
})
