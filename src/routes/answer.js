import { STATUS_FAILED } from '../constants/response.js'
import { sqlAnswerToggleValid } from '../sql/answer.js'
import { sqlGetSurveyById, insertOneAnswer } from '../sql/index.js'
import { Error4xx, asyncHandler, getRequestIp, getRespondData } from '../utils/index.js'

export const answerToggleValid = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const ids = req.body.ids
    const status = req.body.status
    if (Array.isArray(ids) && typeof ids[0] !== 'number') {
        throw new Error4xx(400, '参数错误')
    }
    await sqlAnswerToggleValid(ids, status)
    res.send(resData)
})

/**
 * 获取问卷信息，只获取问卷，不获取皮肤等内容。
 * 同时，由于是公开的，所以草稿相关问卷不会返回。
 */
export const answerGetSurveyByID = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()

    const id = Number(req.params.surveyId)
    if (Number.isNaN(id)) {
        resData.status = STATUS_FAILED
        // 问卷填写链接错误
        resData.msg = 'api.error.survey-link-wrong'
        res.status(404).send(resData)
        return
    }

    const result = await sqlGetSurveyById(id)
    if (result === 'Not Found') {
        resData.status = STATUS_FAILED
        // 不存在此问卷
        resData.msg = 'api.error.survey-not-exist'
        res.status(404).send(resData)
        return
    }

    const survey = result[0]
    const surveyDetail = result[1]

    // 草稿，不可回答
    if (survey.is_draft) {
        resData.status = STATUS_FAILED
        // 问卷未完成
        resData.msg = 'api.error.survey-not-complete'
        res.status(404).send(resData)
        return
    }

    if (survey.is_deleted) {
        resData.status = STATUS_FAILED
        // 问卷已经被删除
        resData.msg = 'api.error.survey-deleted'
        res.status(404).send(resData)
        return
    }
    if (!survey.is_valid) {
        resData.status = STATUS_FAILED
        // 问卷已经停止收集
        resData.msg = 'api.error.survey-stop'
        res.status(404).send(resData)
        return
    }
    if (!surveyDetail) {
        resData.status = STATUS_FAILED
        // 问卷内容不存在
        resData.msg = 'api.error.survey-content-not-exist'
        res.status(404).send(resData)
        return
    }

    /** @type {ResDataOneSurvey} */
    const surveyData = {
        id: survey.id,
        title: survey.title,
        comment: survey.comment,
        structure_json: surveyDetail.structure_json,
    }
    resData.data = surveyData

    res.send(resData)
})


/**
 * 填写一份问卷
 */
export const answerAddOne = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()

    const survey_id = Number(req.params.surveyId)
    if (Number.isNaN(survey_id)) {
        resData.status = STATUS_FAILED
        // 未提供问卷 id
        resData.msg = 'api.error.not-survey-id'
        res.status(400).send(resData)
        return
    }
    /** @type {ReqBodyAnswer} */
    const body = req.body
    await insertOneAnswer({
        survey_id,
        answerUserId: body.userId || 1,
        spend_time: body.spendTime || -1,
        answerStructureJson: body.answerStructureJson,
        ip_from: getRequestIp(req),
        user_agent: req.headers['user-agent'] || '',
    })

    res.send(resData)
})
