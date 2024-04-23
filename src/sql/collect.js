import { useOneConn } from './usePool.js'


/**
 * 分页获取一份问卷的所有答案
 * @returns
 */
export const sqlCollectGetSurveyByIDPage = (surveyId, pageStart, pageSize) => useOneConn(async (conn) => {
    let sql, values, result
    const res = {
        total: 0,
        pageStart,
        pageSize,
        list: [],
    }

    sql = `
        select a.id             as id,
               u.username       as user_name,
               questionnaire_id as survey_id,
               answer_user_id,
               is_valid,
               spend_time,
               ip_from,
               user_agent,
               structure_json   as answer_structure_json,
               b.created_at     as created_at,
               b.updated_at     as updated_at
        from questionnaire_answer as a
                 join questionnaire_answer_detail as b
                 join user as u
        where a.id = b.answer_id
          and a.answer_user_id = u.id
          and a.questionnaire_id = ?
        limit ?, ?;
          `
    values = [surveyId, '' + pageStart, '' + pageSize]
    result = await conn.execute(sql, values)
    res.list = result[0]

    sql = 'select COUNT(*) as c from questionnaire_answer as a where a.questionnaire_id = ?;'
    values = [surveyId]
    result = await conn.execute(sql, values)
    res.total = result[0][0].c


    return res
})
/**
 * 获取一份问卷的所有答案
 * @returns
 */
export const sqlCollectGetSurveyByID = (surveyId) => useOneConn(async (conn) => {
    let sql, values, result

    const res = {
        answerList: [{
            id: 0,
            survey_id: surveyId,
            answer_user_id: 1,
            is_valid: 1,
            spend_time: -1,
            ip_from: '',
            answer_structure_json: {},
            created_at: '',
            updated_at: '',
        }],
    }

    sql = `
        select a.id             as id,
               u.username       as user_name,
               questionnaire_id as survey_id,
               answer_user_id,
               is_valid,
               spend_time,
               ip_from,
               user_agent,
               structure_json   as answer_structure_json,
               b.created_at     as created_at,
               b.updated_at     as updated_at
        from questionnaire_answer as a
                 join questionnaire_answer_detail as b
                 join user as u
        where a.id = b.answer_id
          and a.answer_user_id = u.id
          and a.questionnaire_id = ?;
    `
    values = [surveyId]
    result = await conn.execute(sql, values)
    res.answerList = result[0]

    return res
})

/**
 * 获取统计数据，展示在页面上。
 *
 * @returns
 */
export const sqlGetCountStat = (userId) => useOneConn(async (conn) => {
    let result, sql, values

    const res = {
        count_all_visit: -1,
        count_all_answer: -1,
        count_all_survey: -1,
        count_draft_survey: -1,
        count_publish_survey: -1,
        count_stop_survey: -1,

        today_count_create_survey: -1,
        today_count_publish_survey: -1,
        today_count_answer_survey: -1,
    }

    sql = 'SELECT sum(stat.count_visit) as all_count_visit, sum(stat.count_answer) as all_count_answer ' +
        'from questionnaire q join stat_count stat where q.creator_id = ? and q.id = stat.survey_id;'
    values = [userId]
    result = await conn.execute(sql, values)
    res.count_all_visit = Number(result[0][0].all_count_visit)
    res.count_all_answer = Number(result[0][0].all_count_answer)

    sql = 'SELECT COUNT(*) as c FROM questionnaire WHERE creator_id = ?;'
    result = await conn.execute(sql, values)
    res.count_all_survey += result[0][0].c

    sql = 'SELECT COUNT(*) as c FROM questionnaire WHERE creator_id = ? and is_draft=1 ;'
    result = await conn.execute(sql, values)
    res.count_draft_survey += result[0][0].c

    sql = 'SELECT COUNT(*) as c FROM questionnaire WHERE creator_id = ? and is_valid=1 ;'
    result = await conn.execute(sql, values)
    res.count_publish_survey += result[0][0].c

    sql = 'SELECT COUNT(*) as c FROM questionnaire WHERE creator_id = ? and is_draft=0 and is_valid=0;'
    result = await conn.execute(sql, values)
    res.count_stop_survey += result[0][0].c

    // 根据问卷的创建时间，进行划分为今日的创建问卷数量
    sql = 'SELECT COUNT(*) as c from questionnaire where creator_id = ? and created_at > CURDATE();'
    values = [userId]
    result = await conn.execute(sql, values)
    res.today_count_create_survey = result[0][0].c

    // 根据问卷的创建时间，进行划分为今日的创建问卷数量
    sql = 'SELECT COUNT(*) as c from questionnaire where creator_id = ? and created_at > CURDATE()' +
        ' and is_draft=0 and is_deleted=0 and is_valid=1;'
    values = [userId]
    result = await conn.execute(sql, values)
    res.today_count_publish_survey = result[0][0].c

    // 获取问卷回答数量
    sql = 'SELECT COUNT(a.id) as c ' +
        'from questionnaire_answer as a ' +
        '         join questionnaire as q ' +
        'where q.creator_id = ? ' +
        '  and a.questionnaire_id = q.id ' +
        '  and a.created_at > CURDATE(); '
    values = [userId]
    result = await conn.execute(sql, values)
    res.today_count_answer_survey = result[0][0].c


    return res
})
