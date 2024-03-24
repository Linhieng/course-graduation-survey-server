import { useOneConn } from './index.js'

/**
 *
 * @param {ReqSurveyAche} survey
 * @returns
 */
export const cacheSurvey = (survey) => useOneConn(async (conn) => {
    let result, sql, values

    sql = 'UPDATE `questionnaire`  SET title = ?, comment = ? WHERE id = ?;'
    values = [survey.title, survey.comment, survey.id]
    await conn.execute(sql, values)

    sql = 'SELECT id FROM `questionnaire_detail` WHERE questionnaire_id = ?;'
    values = [survey.id]
    result = await conn.execute(sql, values)

    if (result[0].length < 1) {
        sql = 'INSERT INTO `questionnaire_detail` (structure_json, questionnaire_id) VALUE (?, ?);'
    } else {
        sql = 'UPDATE `questionnaire_detail` SET structure_json = ? WHERE questionnaire_id = ?;'
    }
    values = [survey.structure_json, survey.id]
    await conn.execute(sql, values)
})

/**
 * 初始化一份问卷
 *
 * @param {string} title 问卷标题
 * @returns {Promise<TypeID>} 返回创建后的问卷 id
 */
export const createNewSurvey = (title) => useOneConn(async (conn) => {
    let creator_id = 2
    let sql = 'INSERT INTO `questionnaire` (`title`, `creator_id`) value (?, ?)'
    let values = [title, creator_id]
    let result = await conn.execute(sql, values)
    return result[0].insertId
})

/**
 * 获取当前用户所拥有的所有问卷
 *
 * @param {TypeID} creator_id
 * @returns {Promise<ResGetAllSurveyData[]>}
 */
export const getAllSurvey = (creator_id) => useOneConn(async (conn) => {
    // let sql = 'SELECT (`id`, `title`, `comment`, `sort_order`, `creator_id`, `is_draft`, `is_valid`, `is_deleted`, `created_at`, `updated_at`) FROM `questionnaire` where `creator_id` = ?'
    const sql = 'SELECT * FROM `questionnaire` WHERE `creator_id` = ?'
    let values = [creator_id]
    let result = await conn.execute(sql, values)
    return result[0]
})
