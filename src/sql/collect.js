import { useOneConn } from './usePool.js'

/**
 * 分页 + 条件获取问卷列表
 * @param {SearchSurveyListByPageParams} param0
 * @returns
 */
export const sqlSearchSurveyListByPage = ({
    userId, pageStart, pageSize,
    survey_name: title, survey_desc: comment, survey_status,
    survey_create_range,
}) => useOneConn(async (conn) => {
    let sql, values, result
    /** @type {survey_list: CollectSurveyItem[]} */
    const res = {
        total: 0,
        pageStart,
        pageSize,
        survey_list: [],
    }

    const valid = survey_status === 'all' ? '' : survey_status === 'publish' ? '1' : '0'

    // 虽然这样写很 low，但能实现功能。所以先这样吧，我的 sql 也不熟练
    if (survey_create_range && survey_create_range[0] && survey_create_range[1]) {
        sql = `
            select ifnull(s.count_answer, 0) as collect_answer,
                   ifnull(s.count_visit, 0)  as collect_visited,
                   q.*
            from questionnaire as q

                     left join stat_count as s
                               on q.id = s.survey_id

            where q.creator_id = ?
              and title like ?
              and comment like ?
              and is_draft = 0
              and is_deleted = 0
              and is_valid like ?
              and q.created_at BETWEEN FROM_UNIXTIME(? / 1000) AND FROM_UNIXTIME(? / 1000)
                LIMIT ?, ?
            ;
        `

        values = [userId,
            `%${title}%`,
            `%${comment}%`,
            `%${valid}`,
            survey_create_range[0],
            survey_create_range[1],
            '' + ((pageStart - 1) * pageSize),
            '' + pageSize,
        ]

        result = await conn.execute(sql, values)
        res.survey_list = result[0]

        sql = `
            select count(*) as c
            from questionnaire as q

            where q.creator_id = ?
              and title like ?
              and is_draft = 0
              and is_deleted = 0
              and comment like ?
              and is_valid like ?
              and q.created_at BETWEEN FROM_UNIXTIME(? / 1000) AND FROM_UNIXTIME(? / 1000)
            ;
        `
        values = [userId,
            `%${title}%`,
            `%${comment}%`,
            `%${valid}`,
            survey_create_range[0],
            survey_create_range[1],
        ]
        result = await conn.execute(sql, values)
        res.total = result[0][0].c

        return res

    } else {
        sql = `
            select ifnull(s.count_answer, 0) as collect_answer,
                   ifnull(s.count_visit, 0)  as collect_visited,
                   q.*
            from questionnaire as q

                     left join stat_count as s
                               on q.id = s.survey_id

            where q.creator_id = ?
              and title like ?
              and comment like ?
              and is_draft = 0
              and is_deleted = 0
              and is_valid like ?
            LIMIT ?, ?
            ;
        `

        values = [userId,
            `%${title}%`,
            `%${comment}%`,
            `%${valid}`,
            '' + ((pageStart - 1) * pageSize),
            '' + pageSize,
        ]

        result = await conn.execute(sql, values)
        res.survey_list = result[0]

        sql = `
            select count(*) as c
            from questionnaire as q

            where q.creator_id = ?
              and title like ?
              and is_draft = 0
              and is_deleted = 0
              and comment like ?
              and is_valid like ?
            ;
        `
        values = [userId,
            `%${title}%`,
            `%${comment}%`,
            `%${valid}`,
        ]
        result = await conn.execute(sql, values)
        res.total = result[0][0].c

        return res
    }

})
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
        title: '',
        desc: '',
        list: [
            {
                id: 1,
                user_name: '匿名',
                survey_id: 1,
                answer_user_id: 1,
                is_valid: 1,
                spend_time: -1,
                ip_from: '',
                user_agent: '',
                answer_structure_json: {},
                created_at: '',
                updated_at: '',
            },
        ],
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
    values = [surveyId, '' + ((pageStart - 1) * pageSize), '' + pageSize]
    result = await conn.execute(sql, values)
    res.list = result[0]

    sql = 'select COUNT(*) as c from questionnaire_answer as a where a.questionnaire_id = ?;'
    values = [surveyId]
    result = await conn.execute(sql, values)
    res.total = result[0][0].c

    sql = 'SELECT * FROM questionnaire WHERE id = ? LIMIT 1;'
    result = await conn.execute(sql, values)
    res.title = result[0][0].title
    res.desc = result[0][0].comment


    return res
})
/**
 * 获取一份问卷的所有答案
 * @returns
 */
export const sqlCollectGetSurveyByID = (surveyId) => useOneConn(async (conn) => {
    let sql, values, result

    const res = {
        title: '',
        desc: '',
        surveyData: {},
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

    sql = 'SELECT * FROM questionnaire WHERE id = ? LIMIT 1;'
    result = await conn.execute(sql, values)
    res.title = result[0][0].title
    res.desc = result[0][0].comment

    sql = 'SELECT * FROM `questionnaire_detail` WHERE questionnaire_id = ? LIMIT 1;'
    values = [surveyId]
    result = await conn.execute(sql, values)
    res.surveyData = result[0][0]

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
