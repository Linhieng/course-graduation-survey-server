import { STATUS_FAILED } from '../constants/response.js'
import { cacheSurvey, createNewSurvey, getAllSurvey, getSurveyById, sqlToggleSurveyDeleted } from '../sql/survey.js'
import { asyncHandler, getRespondData } from '../utils/index.js'

export const toggleSurveyValid = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()

    const surveyId = req.params.surveyId
    if (!surveyId || Number.isNaN(surveyId)) {
        resData.status = STATUS_FAILED
        resData.msg = 'surveyId wrong'
        res.status(400).send(resData)
        return
    }

    let valid_status = req.query.valid
    if (valid_status === '1') {
        valid_status = 1
    } else if (valid_status === '0') {
        valid_status = 0
    } else {
        valid_status = undefined
    }

    const result = await sqlToggleSurveyDeleted(surveyId, valid_status)
    if (result === 'Not Found') {
        resData.status = STATUS_FAILED
        resData.msg = 'surveyId not exist'
        res.status(400).send(resData)
        return
    }

    res.send(resData)
})
export const toggleSurveyDelete = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()

    const surveyId = req.params.surveyId
    if (!surveyId || Number.isNaN(surveyId)) {
        resData.status = STATUS_FAILED
        resData.msg = 'surveyId wrong'
        res.status(400).send(resData)
        return
    }

    let deleted_status = req.query.del
    if (deleted_status === '1') {
        deleted_status = 1
    } else if (deleted_status === '0') {
        deleted_status = 0
    } else {
        deleted_status = undefined
    }

    const result = await sqlToggleSurveyDeleted(surveyId, deleted_status)
    if (result === 'Not Found') {
        resData.status = STATUS_FAILED
        resData.msg = 'surveyId not exist'
        res.status(400).send(resData)
        return
    }

    res.send(resData)
})

/**
 * 根据问卷 id 获取问卷信息
 * 注意这是 survey 前缀， 不是用于用户添加的，
 * 所以不考虑 valid 值。
 */
export const GetSurveyByID = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    /** @type {ResOneSurvey} */
    const resData = getRespondData()

    const id = Number(req.params.surveyId)
    if (!id || Number,isNaN(id)) {
        resData.status = STATUS_FAILED
        resData.msg = '问卷id格式错误'
        res.status(422).send(resData)
        return
    }

    const result = await getSurveyById(id)
    if (result === 'Not Found') {
        resData.status = STATUS_FAILED
        resData.msg = '不存在此问卷'
        res.status(404).send(resData)
        return
    }

    const survey = result[0]
    const surveyDetail = result[1]

    if (survey.is_deleted) {
        resData.status = STATUS_FAILED
        resData.msg = '问卷已经被删除'
        res.status(404).send(resData)
        return
    }
    // if (!survey.is_valid) {
    //     resData.status = STATUS_FAILED
    //     resData.msg = '问卷已经停止收集'
    //     res.status(404).send(resData)
    //     return
    // }

    /** @type {ResOneSurveyData} */
    const surveyData = {
        id: survey.id,
        title: survey.title,
        comment: survey.comment,
        questions: surveyDetail.structure_json,
    }
    resData.data = surveyData

    res.send(resData)
})

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
