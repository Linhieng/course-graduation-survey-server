import { useOneConn } from './index.js'

/**
 * 切换问卷的 valid 状态
 *
 * @param {TypeID} id
 * @param {TypeID | undefined} valid_status
 * @return {Promise<'Not Found' | 'ok'>}
 */
export const sqlToggleSurveyValid = (id, valid_status) => useOneConn(async (conn) => {
    let result, sql, values

    sql = 'SELECT is_valid FROM questionnaire WHERE id = ?;'
    values = [id]
    result = await conn.execute(sql, values)
    if (result[0].length < 1) {
        return 'Not Found'
    }
    const is_valid = valid_status || !result[0][0].is_valid

    sql = 'UPDATE questionnaire SET is_valid = ? WHERE id = ?;'
    values = [is_valid, id]
    await conn.execute(sql, values)

    return 'ok'
})

/**
 * 切换问卷的删除状态
 *
 * @param {TypeID} id
 * @param {TypeID | undefined} deleted_status
 * @return {Promise<'Not Found' | 'ok'>}
 */
export const sqlToggleSurveyDeleted = (id, deleted_status) => useOneConn(async (conn) => {
    let result, sql, values

    sql = 'SELECT is_deleted FROM questionnaire WHERE id = ?;'
    values = [id]
    result = await conn.execute(sql, values)
    if (result[0].length < 1) {
        return 'Not Found'
    }
    const is_deleted = deleted_status || !result[0][0].is_deleted

    sql = 'UPDATE questionnaire SET is_deleted = ? WHERE id = ?;'
    values = [is_deleted, id]
    await conn.execute(sql, values)

    return 'ok'
})

/**
 * 获取问卷信息，包括问卷详细信息。
 *
 * @param {TypeID} id
 * @returns {Promise<'Not Found' | [SchemaQuestionnaire, SchemaQuestionnaireDetail]>}
 */
export const getSurveyById = (id) => useOneConn(async (conn) => {
    let result, sql, values
    sql = 'SELECT * FROM `questionnaire_detail` WHERE questionnaire_id = ? LIMIT 1;'
    values = [id]
    result = await conn.execute(sql, values)
    const surveyDetails = result[0]
    sql = 'SELECT * FROM `questionnaire` WHERE id = ? LIMIT 1;'
    result = await conn.execute(sql, values)
    const surveys = result[0]
    if (surveyDetails.length < 0 || surveys.length < 0) {
        return 'Not Found'
    }

    return [surveys[0], surveyDetails[0]]
})

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
    let sql, values, result
    let creator_id = 2
    sql = 'INSERT INTO `questionnaire` (`title`, `creator_id`) value (?, ?)'
    values = [title, creator_id]
    result = await conn.execute(sql, values)
    const id = result[0].insertId

    // 同时初始化一条问卷具体内容信息
    sql = 'INSERT INTO questionnaire_detail(structure_json, questionnaire_id) VALUE (?, ?)'
    values = [{}, id]
    await conn.execute(sql, values)
    return id
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
