import { cacheSurvey, createNewSurvey, getAllSurvey } from '../sql/survey.js'
import { asyncHandler, getRespondData } from '../utils/index.js'

/**
 * 定时缓存用户创建的问卷信息
 */
export const cacheQuestionnaire = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    /** @type {ResCacheSurvey} */
    const resData = getRespondData()

    /** @type {ReqSurveyAche} */
    const survey = req.body

    try {
        await cacheSurvey(survey)
    } catch (error) {
        error.__explain = '缓存失败，未知错误'
        throw error
    }

    resData.data = { time: new Date() }
    res.send(resData)
})

/**
 * 获取当前用户的所有问卷，包含已经被标记为删除的。
 *
 * @param {ExpressRequest} req
 * @param {ExpressResponse} res
 */
export const getAllQuestionnaires = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const all_surveys = await getAllSurvey(2)
    resData.data = { all_surveys }
    res.send(resData)
})

/**
 * 用户点击创建一份问卷
 *
 */
export const createNewQuestionnaire = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()

    // 从数据库中新建一个问卷
    const surveyId = await createNewSurvey('未命名问卷')

    // 将对应问卷信息 id 返回
    resData.data = {surveyId}
    res.send(resData)
})
