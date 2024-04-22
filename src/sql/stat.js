import { getRequestIp } from '../utils/generate.js'
import { useOneConn } from './usePool.js'

/**
 * 按天数进行划分的相关统计数据查询
 * TODO: 代码重复的内容太多了……
 * @param {number} userId
 * @param {number} day
 * @returns
 */
export const sqlStatGroupByDay = (userId, day = 7) => useOneConn(async (conn) => {
    let sql, values = [day - 1, userId], result

    const res = {
        xAxis: [],
        data: [
            { name: '创建问卷', key: 'create_survey', count: 0, value: [] },
            { name: '发布问卷', key: 'publish_survey', count: 0, value: [] },
            { name: '问卷草稿', key: 'draft_survey', count: 0, value: [] },
            { name: '停止收集', key: 'stop_survey', count: 0, value: [] },
            { name: '删除问卷', key: 'del_survey', count: 0, value: [] },
        ],
    }

    const sql_template = (whereStr) => `
        WITH RECURSIVE
        dates_seq AS (
            SELECT CURDATE() AS date_str, 0 AS date_count
            UNION ALL
            SELECT DATE_SUB(date_str, INTERVAL 1 DAY), 0
            FROM dates_seq
            WHERE date_str > DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ),
        questionnaire_counts AS (
            SELECT DATE_FORMAT(q.created_at, '%Y-%m-%d') AS formatted_date, COUNT(*) AS count
            FROM questionnaire AS q
            WHERE creator_id = ? ${whereStr}
            GROUP BY formatted_date)
        SELECT d.date_str,
               COALESCE(qc.count, 0) AS questionnaire_count
        FROM dates_seq d
                 LEFT JOIN questionnaire_counts qc ON d.date_str = qc.formatted_date
        ORDER BY d.date_str;
    `

    sql = sql_template('')
    result = await conn.execute(sql, values)
    result[0].forEach(({ questionnaire_count, date_str }) => {
        res.xAxis.push(date_str)
        res.data[0].count += questionnaire_count
        res.data[0].value.push(questionnaire_count)
    })

    sql = sql_template('and is_draft = 0 and is_valid = 1')
    result = await conn.execute(sql, values)
    result[0].forEach(({ questionnaire_count }) => {
        res.data[1].count += questionnaire_count
        res.data[1].value.push(questionnaire_count)
    })


    sql = sql_template(' and is_draft = 1')
    result = await conn.execute(sql, values)
    result[0].forEach(({ questionnaire_count }) => {
        res.data[2].count += questionnaire_count
        res.data[2].value.push(questionnaire_count)
    })


    sql = sql_template(' and is_draft = 0 and is_valid = 0')
    result = await conn.execute(sql, values)
    result[0].forEach(({ questionnaire_count }) => {
        res.data[3].count += questionnaire_count
        res.data[3].value.push(questionnaire_count)
    })


    sql = sql_template('and is_deleted = 1')
    result = await conn.execute(sql, values)
    result[0].forEach(({ questionnaire_count }) => {
        res.data[4].count += questionnaire_count
        res.data[4].value.push(questionnaire_count)
    })

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

/**
 *
 * @param {*} day
 * @returns
 */
export const sqlStatSurveyVisitGroupByDay = (day = 7) => useOneConn(async (conn) => {
    let sql, values, result
    const res = {
        /** @type {x:string, y:string} */
        chartData: [],
    }

    sql = `
            WITH RECURSIVE
            dates_seq AS (--
                SELECT CURDATE() AS date_str, 0 AS date_count
                UNION ALL
                SELECT DATE_SUB(date_str, INTERVAL 1 DAY), 0
                FROM dates_seq
                WHERE date_str > DATE_SUB(CURDATE(), INTERVAL ? DAY)--
            ),
            counts AS (--
                SELECT DATE_FORMAT(q.created_at, '%Y-%m-%d') AS formatted_date, COUNT(*) AS count
                FROM record_visit AS q
                WHERE method = 'GET'
                  and router LIKE ?
                GROUP BY formatted_date --
            )
        SELECT d.date_str as d,
               COALESCE(qc.count, 0) AS count
        FROM dates_seq d
                 LEFT JOIN counts qc ON d.date_str = qc.formatted_date
        ORDER BY d.date_str;
    `
    values = [day - 1, '/api/answer/%']
    result = await conn.execute(sql, values)
    result[0].forEach(({ d: x, count: y }) => {
        res.chartData.push({ x, y })
    })

    return res
})

/**
 * 添加一条访问记录
 */
export const sqlAddOneVisitRecord = (/** @type {import('express').Request}*/req) => useOneConn(async (conn) => {
    let sql, values
    sql = `
        insert into
        record_visit
            (survey_id, user_id, ip, user_agent, visit_type, method, router, info)
        value (?, ?, ?, ?, ?, ?, ?, ?)
    `
    values = [
        req.params.surveyId || -1,
        req.auth?.userId || 1,
        getRequestIp(req),
        req.headers['user-agent'],
        0, // 访问类型没想好，统一为 0
        req.method,
        req.url,
        '',
    ]
    conn.execute(sql, values)
})
