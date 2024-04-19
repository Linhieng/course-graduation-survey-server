import { SqlError } from '../utils/index.js'
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

    sql = 'INSERT INTO user_info (account_id, name, avatar) VALUE ( ?, ?, ? );'
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

/**
 *
 * @param {TypeID} userId
 * @param {Partial<UserInfoCanModified>} userInfo
 * @returns
 */
export const sqlUpdateUserInfo = (userId, userInfo) => useOneConn(async (conn) => {
    let sql, values, result

    sql = 'select * from user_info where account_id = ?;'
    values = [userId]
    result = await conn.execute(sql, values)

    if (result[0].length < 1) throw new Error('api.error.not-user-info')

    const info = result[0][0]

    // TODO: 这也太 lou 了。能跑就行。
    if (userInfo.name) { info.name = userInfo.name }
    if (userInfo.avatar) { info.avatar = userInfo.avatar }
    if (userInfo.email) { info.email = userInfo.email }
    if (userInfo.job) { info.job = userInfo.job }
    if (userInfo.job_name) { info.job_name = userInfo.job_name }
    if (userInfo.organization) { info.organization = userInfo.organization }
    if (userInfo.organization_name) { info.organization_name = userInfo.organization_name }
    if (userInfo.location) { info.location = userInfo.location }
    if (userInfo.location_name) { info.location_name = userInfo.location_name }
    if (userInfo.introduction) { info.introduction = userInfo.introduction }
    if (userInfo.personal_website) { info.personal_website = userInfo.personal_website }
    if (userInfo.phone) { info.phone = userInfo.phone }

    sql = 'update user_info set name = ?, avatar = ?, email = ?, job = ?, job_name = ?, organization = ?, organization_name = ?, location = ?, location_name = ?, introduction = ?, personal_website = ?, phone = ? where account_id = ?;'
    values = [info.name, info.avatar, info.email, info.job, info.job_name, info.organization, info.organization_name, info.location, info.location_name, info.introduction, info.personal_website, info.phone, userId]
    await conn.execute(sql, values)
})

/**
 *
 * @param {ReqAuth} auth
 * @param {ChangePasswordData} data
 * @returns
 */
export const sqlCHangePassword = (auth, data) => useOneConn(async (conn) => {
    let sql, values, result

    sql = 'select password_hash from user where id = ?;'
    values = [auth.userId]
    result = await conn.execute(sql, values)

    if (result[0].length < 1) throw new SqlError(400, 'api.error.password')

    if (result[0][0].password_hash !== data.oldPassword_hash) {
        throw new SqlError(200, 'api.error.password')
    }

    sql = 'update user set password_hash = ? where id =?;'
    values = [data.newPassword_hash, auth.userId]
    result = await conn.execute(sql, values)


})
