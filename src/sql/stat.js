import { useOneConn } from './usePool.js'

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

    return res
})
