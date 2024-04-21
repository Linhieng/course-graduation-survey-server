import { useOneConn } from './index.js'

/**
 * 返回一份问卷，同时携带该问卷收集到的所有回答
 *
 * @param {number} surveyId
 * @returns
 */
export const getStatData = (surveyId) => useOneConn(async (conn) => {
    let result, sql,
        values = [surveyId]

    sql = 'SELECT * ' +
        'FROM questionnaire q ' +
        'INNER JOIN questionnaire_detail qd ON q.id = qd.questionnaire_id ' +
        'WHERE q.id = ? LIMIT 1'
    result = await conn.execute(sql, values)
    if (result[0].length < 1) {
        return 'Not Found'
    }
    const surveyData = result[0][0]

    sql = 'SELECT * ' +
        'FROM questionnaire_answer qa ' +
        'INNER JOIN questionnaire_answer_detail qad ON qa.id = qad.answer_id ' +
        'WHERE qa.questionnaire_id = ?; '
    result = await conn.execute(sql, values)
    const answersData = result[0] || []

    return {
        surveyData,
        answersData,
    }
})

/**
 * 新增一条问卷回答记录。
 *
 * @param {ReqSurveyAnswer} body
 * @param {string} ip
 * @returns
 */
export const insertOneAnswer = (body, ip) => useOneConn(async (conn) => {
    let result, sql, values

    const survey_id = body.surveyId
    // 1 表示匿名用户
    const answer_user_id = body.answerUserId || 1
    const spend_time = body.spendTime
    const ip_from = ip
    const answerDetail = body.answerDetail

    sql = 'INSERT INTO `questionnaire_answer` (questionnaire_id, answer_user_id, spend_time, ip_from) ' +
        'VALUE (?, ?, ?, ?);'
    values = [survey_id, answer_user_id, spend_time, ip_from]
    result = await conn.execute(sql, values)
    const answerId = result[0].insertId

    sql = 'INSERT INTO `questionnaire_answer_detail` (answer_id, structure_json) VALUE (?, ?);'
    values = [answerId, answerDetail]
    result = await conn.execute(sql, values)
})


/**
 * 发布一份问卷。变更 is_draft 为 0，变更 is_valid 为 1
 *
 * @param {TypeID} id
 * @return {Promise<'Not Found' | 'ok'>}
 */
export const sqlPublishSurvey = (id) => useOneConn(async (conn) => {
    let result, sql, values

    sql = 'SELECT is_valid FROM questionnaire WHERE id = ?;'
    values = [id]
    result = await conn.execute(sql, values)
    if (result[0].length < 1) {
        return 'Not Found'
    }

    sql = 'UPDATE questionnaire SET is_draft = ?, is_valid = ? WHERE id = ?;'
    values = [0, 1, id]
    await conn.execute(sql, values)

    return 'ok'
})


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
    if (surveyDetails.length < 1 || surveys.length < 1) {
        return 'Not Found'
    }

    return [surveys[0], surveyDetails[0]]
})

/** 更新已有问卷 */
export const sqlUpdateSurvey = (surveyId, title, comment, structure_json) => useOneConn(async (conn) => {
    let result, sql, values

    sql = 'UPDATE `questionnaire`  SET title = ?, comment = ? WHERE id = ?;'
    values = [title, comment, surveyId]
    await conn.execute(sql, values)

    sql = 'SELECT id FROM `questionnaire_detail` WHERE questionnaire_id = ?;'
    values = [surveyId]
    result = await conn.execute(sql, values)

    if (result[0].length < 1) {
        sql = 'INSERT INTO `questionnaire_detail` (structure_json, questionnaire_id) VALUE (?, ?);'
    } else {
        sql = 'UPDATE `questionnaire_detail` SET structure_json = ? WHERE questionnaire_id = ?;'
    }

    values = [structure_json, surveyId]
    await conn.execute(sql, values)

    return surveyId
})

/** 创建一份新的问卷 */
export const sqlCreateNewSurvey = (userId, title, comment, structure_json) => useOneConn(async (conn) => {
    let sql, values, result
    sql = 'INSERT INTO `questionnaire` (creator_id, title, comment) value (?, ?, ?)'
    values = [userId, title, comment]
    result = await conn.execute(sql, values)
    const surveyId = result[0].insertId
    // 同时初始化一条问卷具体内容信息
    sql = 'INSERT INTO questionnaire_detail(structure_json, questionnaire_id) VALUE (?, ?)'
    values = [structure_json, surveyId]
    await conn.execute(sql, values)
    return surveyId
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
