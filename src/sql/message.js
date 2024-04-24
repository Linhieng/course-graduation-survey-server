import { useOneConn } from './usePool.js'

// export const getSqlArr = (arr) => {
//     return `(${arr.join(',')})`
// }

/**
 * 批量修改消息的状态，标记已读或未读
 * @param {number[]} id_arr 要变更的 id
 * @param {number} status
 * @returns
 */
export const sqlSetMessageStatus = (id_arr, status = 1) => useOneConn(async (conn) => {
    let sql, values
    sql = `update user_message set message_status = ? where id in (${Array(id_arr.length).fill('?').join(',')});`
    values = [status, ...id_arr]
    await conn.execute(sql, values)
})

/** 获取所有消息、未读消息和已读消息 */
export const sqlGetUnreadMessage = (userId) => useOneConn(async (conn) => {
    let sql, values = [userId], result
    const res = {
        unread: [{
            'id': 1,
            'user_id': 13,
            'message_type': 1,
            'message_from': 'system',
            'content': '收到一份新的回答',
            'survey_id': 172,
            'answer_id': 32,
            'message_status': 0,
            'created_at': '2024-04-24T06:45:44.000Z',
            'updated_at': '2024-04-24T07:26:29.000Z',
        }],
        read: [],
        all: [],
    }
    sql = 'select * from user_message where user_id = ? and message_status = 0;'
    result = await conn.execute(sql, values)
    res.unread = result[0]

    sql = 'select * from user_message where user_id = ? and message_status = 1'
    result = await conn.execute(sql, values)
    res.read = result[0]

    sql = 'select * from user_message where user_id = ?'
    result = await conn.execute(sql, values)
    res.all = result[0]

    return res
})
