import { useOneConn } from './usePool.js'

/**
 * 设置问题是否有效。
 * @param {number[]} ids 要修改的问题 id
 * @param {0|1|undefined} status 设置是否有效，0 表示无效，1表示有效
 * @returns
 */
export const sqlAnswerToggleValid = (ids, status = 1) => useOneConn(async (conn) => {
    let sql, values
    // 这里没有考虑当前用户是否有这个权限修改这份问卷答案。要考虑的话，需要连表。如果这个时候有冗余数据记录当前
    // 问题属于哪个用户的话，就简单了……
    sql = `update questionnaire_answer set is_valid = ? where id in (${Array(ids.length).fill('?').join(',')});`
    values = [status, ...ids]
    await conn.execute(sql, values)
})
