import { sqlCollectGetSurveyByID, sqlCollectGetSurveyByIDPage, sqlSearchSurveyListByPage } from '../sql/collect.js'
import { Error4xx, asyncHandler, getRespondData } from '../utils/index.js'

/**
 * 获取一份问卷的所有回答记录。
 */
export const collectGetSurveyByID = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const survey_id = Number(req.params.surveyId)
    if (isNaN(survey_id)) {
        throw new Error4xx(400, '不正确的 survey id')
    }

    resData.data = await sqlCollectGetSurveyByID(survey_id)
    res.send(resData)
})

/**
 * 分页获取一份问卷的所有回答记录。
 */
export const collectGetSurveyByIDPage = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const survey_id = Number(req.params.surveyId)
    const pageStart = Number(req.query.pageStart)
    const pageSize = Number(req.query.pageSize)
    if (isNaN(survey_id) || isNaN(pageStart) || isNaN(pageSize)) {
        throw new Error4xx(400, '不正确的请求参数')
    }

    resData.data = await sqlCollectGetSurveyByIDPage(survey_id, pageStart, pageSize)
    res.send(resData)
})

/**
 * 条件 + 分页搜索对应问卷。
 */
export const searchSurveyListByPage = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const userId = Number(req.auth.userId)
    const pageStart = Number(req.query.pageStart)
    const pageSize = Number(req.query.pageSize)
    const survey_name = req.query.survey_name
    const survey_desc = req.query.survey_desc
    const survey_status = req.query.survey_status
    const survey_create_range = req.query.survey_create_range

    if (isNaN(userId) || isNaN(pageStart) || isNaN(pageSize)) {
        throw new Error4xx(400, '不正确的请求参数')
    }

    resData.data = await sqlSearchSurveyListByPage({
        userId, pageStart, pageSize,
        survey_name,
        survey_desc,
        survey_status,
        survey_create_range,
    })
    res.send(resData)
})
