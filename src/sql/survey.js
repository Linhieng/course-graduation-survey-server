import { useOneConn } from './index.js'

/**
 * 获取相关问卷统计信息。暂时就这么多吧。
 *
 * @param {*} userId
 * @returns {Promise<ResDataSurveyStatInfo>} 出错交给默认程序处理。
 */
export const sqlGetSurveyStat = (userId) => useOneConn(async (conn) => {
    let sql, result, values = [userId]
    /** @type {ResDataSurveyStatInfo} */
    const res = {
        all_survey_count: undefined,
        draft_survey_count: undefined,
        publish_survey_count: undefined,
        stop_survey_count: undefined,
        del_survey_count: undefined,
        total_answer_count: 0,
        all_survey_info: {},
    }

    sql = 'SELECT COUNT(*) as c FROM questionnaire WHERE creator_id = ?;'
    result = await conn.execute(sql, values)
    res.all_survey_count = result[0][0].c
    sql = 'SELECT COUNT(*) as c FROM questionnaire WHERE creator_id = ? AND is_draft = 1;'
    result = await conn.execute(sql, values)
    res.draft_survey_count = result[0][0].c
    sql = 'SELECT COUNT(*) as c FROM questionnaire WHERE creator_id = ? AND is_draft = 0 AND is_deleted = 1;'
    result = await conn.execute(sql, values)
    res.del_survey_count = result[0][0].c
    sql = 'SELECT COUNT(*) as c FROM questionnaire WHERE creator_id = ? AND is_draft = 0 AND is_deleted = 0 AND is_valid = 0;'
    result = await conn.execute(sql, values)
    res.publish_survey_count = result[0][0].c
    sql = 'SELECT COUNT(*) as c FROM questionnaire WHERE creator_id = ? AND is_draft = 0 AND is_deleted = 0 AND is_valid = 1;'
    result = await conn.execute(sql, values)
    res.stop_survey_count = result[0][0].c

    sql = `SELECT s.id as sur, s.title as title,  COUNT(a.id) AS ans
        FROM questionnaire s
        LEFT JOIN questionnaire_answer a ON s.id = a.questionnaire_id
        WHERE s.creator_id = ?
        GROUP BY s.id`
    // result[0] 是一个对象数组，对象的 key 分别是 sur, title 和 ans，值就是具体的值。
    result = await conn.execute(sql, values)
    result[0].forEach((item) => {
        res.total_answer_count += item.ans
        res.all_survey_info[item.sur] = {
            surveyId: item.sur,
            title: item.title,
            answer_count: item.ans,
        }
    })
    return res
})

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
export const insertOneAnswer = ({
    survey_id, answerUserId, spend_time,
    ip_from, answerStructureJson,
}) => useOneConn(async (conn) => {
    let result, sql, values

    sql = 'INSERT INTO `questionnaire_answer` (questionnaire_id, answer_user_id, spend_time, ip_from) ' +
        'VALUE (?, ?, ?, ?);'
    values = [survey_id, answerUserId, spend_time, ip_from]
    result = await conn.execute(sql, values)
    const answerId = result[0].insertId

    sql = 'INSERT INTO `questionnaire_answer_detail` (answer_id, structure_json) VALUE (?, ?);'
    values = [answerId, answerStructureJson]
    result = await conn.execute(sql, values)
})


/**
 * @param {TypeID} id
 * @return {Promise<'Not Found' | 'ok'>}
 */
export const sqlRecoverSurvey = (id) => useOneConn(async (conn) => {
    let result, sql, values

    sql = 'SELECT is_valid FROM questionnaire WHERE id = ?;'
    values = [id]
    result = await conn.execute(sql, values)
    if (result[0].length < 1) {
        return 'Not Found'
    }

    sql = 'UPDATE questionnaire SET is_draft = ?, is_valid = ?, is_deleted = ? WHERE id = ?;'
    values = [0, 0, 0, id]
    await conn.execute(sql, values)

    return 'ok'
})
/**
 * @param {TypeID} id
 * @return {Promise<'Not Found' | 'ok'>}
 */
export const sqlDelSurvey = (id) => useOneConn(async (conn) => {
    let result, sql, values

    sql = 'SELECT is_valid FROM questionnaire WHERE id = ?;'
    values = [id]
    result = await conn.execute(sql, values)
    if (result[0].length < 1) {
        return 'Not Found'
    }

    sql = 'UPDATE questionnaire SET is_draft = ?, is_valid = ?, is_deleted = ? WHERE id = ?;'
    values = [0, 0, 1, id]
    await conn.execute(sql, values)

    return 'ok'
})
/**
 * 停止问卷的收集。变更 is_draft 为 0，变更 is_valid 为 1
 *
 * @param {TypeID} id
 * @return {Promise<'Not Found' | 'ok'>}
 */
export const sqlStopSurvey = (id) => useOneConn(async (conn) => {
    let result, sql, values

    sql = 'SELECT is_valid FROM questionnaire WHERE id = ?;'
    values = [id]
    result = await conn.execute(sql, values)
    if (result[0].length < 1) {
        return 'Not Found'
    }

    sql = 'UPDATE questionnaire SET is_draft = ?, is_valid = ? WHERE id = ?;'
    values = [0, 0, id]
    await conn.execute(sql, values)

    return 'ok'
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
export const sqlGetSurveyById = (id) => useOneConn(async (conn) => {
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

/** 更新并发布已有问卷 */
export const sqlUpdateAndPublishSurvey = (surveyId, title, comment, structure_json) => useOneConn(async (conn) => {
    let result, sql, values

    sql = 'UPDATE `questionnaire`  SET title = ?, comment = ?, is_draft = 0, is_valid = 1 WHERE id = ?;'
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

// /**
//  * 初始化一份问卷
//  *
//  * @param {string} title 问卷标题
//  * @returns {Promise<TypeID>} 返回创建后的问卷 id
//  */
// export const createNewSurvey = (title) => useOneConn(async (conn) => {
//     let sql, values, result
//     let creator_id = 2
//     sql = 'INSERT INTO `questionnaire` (`title`, `creator_id`) value (?, ?)'
//     values = [title, creator_id]
//     result = await conn.execute(sql, values)
//     const id = result[0].insertId

//     // 同时初始化一条问卷具体内容信息
//     sql = 'INSERT INTO questionnaire_detail(structure_json, questionnaire_id) VALUE (?, ?)'
//     values = [{}, id]
//     await conn.execute(sql, values)
//     return id
// })

/**
 * 获取当前用户所拥有的所有问卷
 *
 * @param {TypeID} creator_id
 * @returns {Promise<ResGetAllSurveyData[]>}
 */
export const sqlGetAllSurvey = (creator_id) => useOneConn(async (conn) => {
    // let sql = 'SELECT (`id`, `title`, `comment`, `sort_order`, `creator_id`, `is_draft`, `is_valid`, `is_deleted`, `created_at`, `updated_at`) FROM `questionnaire` where `creator_id` = ?'
    const sql = 'SELECT * FROM `questionnaire` WHERE `creator_id` = ?'
    let values = [creator_id]
    let result = await conn.execute(sql, values)
    return result[0]
})


/**
 * 获取当前用户所拥有的已发布的问卷
 *
 * @param {TypeID} userId
 * @returns {Promise<ResGetAllSurveyData[]>}
 */
export const sqlGetPublishSurvey = (userId) => useOneConn(async (conn) => {
    // let sql = 'SELECT (`id`, `title`, `comment`, `sort_order`, `creator_id`, `is_draft`, `is_valid`, `is_deleted`, `created_at`, `updated_at`) FROM `questionnaire` where `creator_id` = ?'
    const sql = 'SELECT * FROM `questionnaire` WHERE `creator_id` = ? and is_draft = 0 and is_valid = 1 and is_deleted = 0'
    let values = [userId]
    let result = await conn.execute(sql, values)
    return result[0]
})

/**
 * 获取当前用户所拥有的草稿的问卷
 *
 * @param {TypeID} userId
 * @returns {Promise<ResGetAllSurveyData[]>}
 */
export const sqlGetDraftSurvey = (userId) => useOneConn(async (conn) => {
    // let sql = 'SELECT (`id`, `title`, `comment`, `sort_order`, `creator_id`, `is_draft`, `is_valid`, `is_deleted`, `created_at`, `updated_at`) FROM `questionnaire` where `creator_id` = ?'
    const sql = 'SELECT * FROM `questionnaire` WHERE `creator_id` = ? and is_draft = 1 and is_deleted = 0'
    let values = [userId]
    let result = await conn.execute(sql, values)
    return result[0]
})

/**
 * 获取当前用户所拥有的已删除的问卷
 *
 * @param {TypeID} userId
 * @returns {Promise<ResGetAllSurveyData[]>}
 */
export const sqlGetDelSurvey = (userId) => useOneConn(async (conn) => {
    // let sql = 'SELECT (`id`, `title`, `comment`, `sort_order`, `creator_id`, `is_draft`, `is_valid`, `is_deleted`, `created_at`, `updated_at`) FROM `questionnaire` where `creator_id` = ?'
    const sql = 'SELECT * FROM `questionnaire` WHERE `creator_id` = ? and is_deleted = 1'
    let values = [userId]
    let result = await conn.execute(sql, values)
    return result[0]
})

/**
 * 获取当前用户所拥有的已停止回收的问卷
 *
 * @param {TypeID} userId
 * @returns {Promise<ResGetAllSurveyData[]>}
 */
export const sqlGetStopSurvey = (userId) => useOneConn(async (conn) => {
    // let sql = 'SELECT (`id`, `title`, `comment`, `sort_order`, `creator_id`, `is_draft`, `is_valid`, `is_deleted`, `created_at`, `updated_at`) FROM `questionnaire` where `creator_id` = ?'
    const sql = 'SELECT * FROM `questionnaire` WHERE `creator_id` = ? and is_draft = 0 and is_valid = 0 and is_deleted = 0'
    let values = [userId]
    let result = await conn.execute(sql, values)
    return result[0]
})
