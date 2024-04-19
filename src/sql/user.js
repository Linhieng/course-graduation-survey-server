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
 * 添加一个普通用户，同时创建对应信息表
 *
 * @param {string} username - 用户名
 * @param {string} password_hash - 加密后的密码
 * @returns {Promise<'existed' | MysqlResultSetHeader>} 如果用户名已存在，则返回 'existed'
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

    sql = 'INSERT INTO user_info (account_id, name, avatar_url) VALUE ( ?, ?, ? );'
    values = [result[0].insertId, username, 'https://pic.imgdb.cn/item/662266030ea9cb1403a3b688.jpg']
    await conn.execute(sql, values)

    return result[0]
})

/**
 *
 * @param {number} userId
 * @returns {Promise<'not' | SchemaUserInfo>} 不存在则返回 'not'
 */
export const sqlGetUserInfo = (userId) => useOneConn(async (conn) => {
    let sql = 'SELECT * FROM `user_info` WHERE `account_id` = ? LIMIT 1'
    let values = [userId]
    let result = await conn.execute(sql, values)
    if (result[0].length < 1) {
        return 'not'
    }

    return result[0][0]
})
