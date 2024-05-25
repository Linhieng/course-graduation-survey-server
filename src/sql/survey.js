import { SqlError } from '../utils/handleError.js'
import { useOneConn } from './index.js'

//
/** 更新问卷内容 */
export const sqlUpdateOneSurvey = (userId, surveyId, data) => useOneConn(async (conn) => {
    let sql, values

    sql = `update questionnaire
        set title = ?, comment = ?
        where id = ? and creator_id = ?;
    `
    values = [data.title, data.comment, surveyId, userId]
    await conn.execute(sql, values)
})

/**
 * 分页 + 条件获取问卷列表
 * @param {SearchSurveyByPageParams} param0
 * @returns
 */
export const sqlSearchSurveyByPage = ({
    userId, pageStart, pageSize,
    title,
    comment,
    survey_type,
    status,
    is_template,
    created_range,
    updated_range,
    order_by,
    order_type,
}) => useOneConn(async (conn) => {
    let sql, values, result

    const res = {
        total: 0,
        pageStart,
        pageSize,
        survey_list: [],
    }

    sql = `
            select ifnull(s.count_answer, 0) as collect_answer,
                   ifnull(s.count_visit, 0)  as collect_visited,
                   q.*
            from questionnaire as q

                     left join stat_count as s
                               on q.id = s.survey_id

            where q.creator_id = ?
        `
    values = [userId]

    if (title !== undefined && title.trim() !== '') {
        sql += ' and q.title like ? '
        values.push(`%${title}%`)
    }
    if (comment !== undefined && comment.trim() !== '') {
        sql += ' and q.comment like ? '
        values.push(`%${comment}%`)
    }
    if (survey_type !== undefined) {
        sql += ' and q.survey_type = ? '
        values.push(survey_type)
    }
    if (status !== undefined) {
        if (status === 0) {
            sql += ' and q.is_deleted = ? '
            values.push(1)
        } else if (status === 1) {
            sql += ' and q.is_deleted = ? and q.is_draft = ? '
            values.push(0, 1)
        } else if (status === 2) {
            sql += ' and q.is_deleted = ? and q.is_draft = ? and q.is_valid = ? '
            values.push(0, 0, 1)
        } else if (status === 3) {
            sql += ' and q.is_deleted = ? and q.is_draft = ? and q.is_valid = ? '
            values.push(0, 0, 0)
        }
    }
    if (is_template !== undefined) {
        sql += ' and q.is_template = ? '
        values.push(is_template)
    }
    if (created_range !== undefined) {
        sql += ' and q.created_at BETWEEN FROM_UNIXTIME(? / 1000) AND FROM_UNIXTIME(? / 1000) '
        values.push(created_range[0], created_range[1])
    }
    if (updated_range !== undefined) {
        sql += ' and q.updated_at BETWEEN FROM_UNIXTIME(? / 1000) AND FROM_UNIXTIME(? / 1000) '
        values.push(updated_range[0], updated_range[1])
    }
    if (order_by !== undefined && order_by !== '') {
        if (Array.isArray(order_by)) {
            sql += ` order by ${order_by.join(' ')}  `
        } else if (['updated_at', 'created_at', 'collect_visited', 'collect_answer'].includes(order_by)) {
            sql += ` order by ${order_by} `
        }
        if (order_type === 'ASC' || order_type === 'DESC') {
            sql += ` ${order_type} `
        }
    }

    // 既然我已经获取所有数据的，那真的不如直接自己实现分页……，而不是使用 limit
    result = await conn.execute(sql, values)
    res.total = result[0].length

    if (pageStart !== undefined && pageSize !== undefined) {
        const offset = '' + ((pageStart - 1) * pageSize)
        const size = '' + pageSize
        sql += ' LIMIT ?, ? '
        values.push(offset, size)
    }


    result = await conn.execute(sql, values)
    res.survey_list = result[0]
    res.pageStart = pageStart || 1
    res.pageSize = pageSize || result[0].length

    return res
})




















/**
 * 获取一份模版问卷，如果 userId 等于要获取的问卷的创建者，则返回问卷模板。
 * 否则需要问卷为公开才可获取。
 * @param {*} userId
 * @param {*} surveyId
 * @param {*} is_share
 * @returns
 */
export const sqlGetShareSurveyTemplate = (userId, surveyId) => useOneConn(async (conn) => {
    let sql, values, result
    let survey

    sql = `
        select creator_id, is_template, q.*, d.structure_json from questionnaire as q
        join questionnaire_detail as d on q.id = d.questionnaire_id
                                   where q.id = ?;
    `
    values = [surveyId]
    result = await conn.execute(sql, values)

    if (result[0][0].creator_id === userId || result[0][0].is_template === 2) {
        survey = result[0][0]
        // 这里可以继续为其基于该模版创建一份问卷，然后直接返回。
        // 但也可以由前端进行创建。
    } else {
        throw new SqlError(403, '无权限')
    }

    return survey

})

/**
 *
 * @param {number} userId 只能修改自己的问卷
 * @param {number} surveyId
 * @param {number} is_share  1 表示不共享，2 表示共享
 * @returns
 */
export const sqlSetSurveyTemplateShare = (userId, surveyId, is_share) => useOneConn(async (conn) => {
    let sql, values, result
    // 未提供时，默认是 toggle
    if (is_share === undefined) {
        sql = 'select is_template from questionnaire where id = ? and creator_id = ?;'
        values = [surveyId, userId]
        result = await conn.execute(sql, values)
        is_share = result[0][0].is_template === 1 ? 2 : 1
    }

    sql = 'update questionnaire set is_template = ? where id = ? and creator_id = ?;'
    values = ['' + is_share, surveyId, userId]
    await conn.execute(sql, values)
    return {
        is_template: is_share,
    }
})

/**
 * 获取当前系统中所拥有的所有问卷模版。可以分页，也可以不分页
 *
 * @param {undefined|number} pageStart 前端是 1 开始，数据库得从 0 开始
 * @param {undefined|number} pageSize
 * @returns
 */
export const sqlGetSurveyAllTemplate = (pageStart, pageSize) => useOneConn(async (conn) => {
    let sql, values, result
    const res = {
        count: 0,
        pageStart: pageStart || 1,
        pageSize: pageSize,
        surveyTemplate: [],
    }
    if (pageStart && pageSize) {
        sql = 'SELECT * FROM questionnaire where is_template = ? LIMIT ?, ?'
        values = [2, '' + ((pageStart - 1) * pageSize), '' + pageSize]
    } else {
        sql = 'SELECT * FROM questionnaire where is_template = ?'
        values = [2]
    }
    result = await conn.execute(sql, values)
    res.surveyTemplate = result[0]

    sql = 'SELECT COUNT(*) as c  FROM questionnaire where is_template = ?'
    values = [2]
    result = await conn.execute(sql, values)
    res.count = result[0][0].c
    if (!pageSize) res.pageSize = res.count
    return res
})
/**
 * 只获取用户的问卷模版
 *
 * @param {number} userId
 * @param {undefined|number} pageStart 页数，从 1 开始
 * @param {undefined|number} pageSize
 * @returns
 */
export const sqlGetSurveyMyTemplate = (userId, pageStart, pageSize) => useOneConn(async (conn) => {
    let sql, values, result
    const res = {
        count: 0,
        pageStart: pageStart,
        pageSize: pageSize,
        surveyTemplate: [],
    }
    if (pageStart && pageSize) {
        sql = 'SELECT * FROM questionnaire where is_template != 0 and creator_id = ? LIMIT ?, ?'
        values = [userId, '' + ((pageStart - 1) * pageSize), '' + pageSize]
    } else {
        sql = 'SELECT * FROM questionnaire where is_template != 0 and creator_id = ?'
        values = [userId]
    }
    result = await conn.execute(sql, values)
    res.surveyTemplate = result[0]

    sql = 'SELECT COUNT(*) as c  FROM questionnaire where is_template != 0 and creator_id = ?'
    values = [userId]
    result = await conn.execute(sql, values)
    res.count = result[0][0].c
    if (!pageSize) res.pageSize = res.count
    return res
})

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
    user_agent,
}) => useOneConn(async (conn) => {
    let result, sql, values

    // 获取问卷所属用户
    sql = 'select creator_id as userId from questionnaire where id = ?'
    values = [survey_id]
    result = await conn.execute(sql, values)
    const userId = result[0][0].userId

    sql = 'INSERT INTO `questionnaire_answer` (questionnaire_id, answer_user_id, spend_time, ip_from, user_agent) ' +
        'VALUE (?, ?, ?, ?, ?);'
    values = [survey_id, answerUserId, spend_time, ip_from, user_agent]
    result = await conn.execute(sql, values)
    const answerId = result[0].insertId

    sql = 'INSERT INTO `questionnaire_answer_detail` (answer_id, structure_json) VALUE (?, ?);'
    values = [answerId, answerStructureJson]
    result = await conn.execute(sql, values)

    // 添加一条回答记录
    // 添加一次访问量。感觉这种日志类的不适合放在这里。但考虑到事务，似乎又应该放在这里。
    sql = 'SELECT COUNT(*) as n from stat_count where survey_id = ? limit 1;'
    values = [survey_id]
    result = await conn.execute(sql, values)
    if (result[0][0].n < 1) {
        sql = 'INSERT INTO stat_count(survey_id, count_visit, count_answer) value (?, ?, ?);'
        values = [survey_id, 1, 1]
        result = await conn.execute(sql, values)
    } else {
        sql = 'UPDATE stat_count set count_answer = count_answer + 1 where survey_id = ?;'
        values = [survey_id]
        result = await conn.execute(sql, values)
    }

    // 添加到消息
    sql = `
        INSERT INTO user_message(user_id, content, survey_id, answer_id)
        value (?, ?, ?, ?)
    `
    values = [userId, '收到一份新的回答', survey_id, answerId]
    await conn.execute(sql, values)
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

    /** 这里有问题，因为在后台中获取问卷时也会调用该函数，将此时不应该增加访问量 */
    // 添加一次访问量。感觉这种日志类的不适合放在这里。但考虑到事务，似乎又应该放在这里。
    sql = 'SELECT COUNT(*) as n from stat_count where survey_id = ? limit 1;'
    values = [id]
    result = await conn.execute(sql, values)
    if (result[0][0].n < 1) {
        sql = 'INSERT INTO stat_count(survey_id, count_visit, count_answer) value (?, ?, ?);'
        values = [id, 1, 0]
        result = await conn.execute(sql, values)
    } else {
        sql = 'UPDATE stat_count set count_visit = count_visit + 1 where survey_id = ?;'
        values = [id]
        result = await conn.execute(sql, values)
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
export const sqlCreateNewSurvey = ({ userId, title, comment, structure_json, survey_type, is_template }) => useOneConn(async (conn) => {
    let sql, values, result
    sql = 'INSERT INTO `questionnaire` (creator_id, title, comment, survey_type, is_template) value (?, ?, ?, ?, ?)'
    values = [userId, title, comment, survey_type, is_template]
    result = await conn.execute(sql, values)
    const surveyId = result[0].insertId
    // 同时初始化一条问卷具体内容信息
    sql = 'INSERT INTO questionnaire_detail(structure_json, questionnaire_id) VALUE (?, ?)'
    values = [structure_json, surveyId]
    await conn.execute(sql, values)

    // 同时初始化统计表
    sql = 'INSERT INTO stat_count(survey_id, count_visit, count_answer) value (?, ?, ?);'
    values = [surveyId, 0, 0]

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
    const sql = 'SELECT * FROM `questionnaire` WHERE `creator_id` = ? and is_draft = 0 and is_valid = 1 and is_deleted = 0 ORDER BY created_at DESC;'
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
    const sql = 'SELECT * FROM `questionnaire` WHERE `creator_id` = ? and is_draft = 1 and is_deleted = 0 and is_template = 0'
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
