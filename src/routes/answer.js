import { STATUS_FAILED } from '../constants/response.js'
import { getSurveyById } from '../sql/index.js'
import { asyncHandler, getRespondData } from '../utils/index.js'

/**
 * 用户填写问卷时，获取问卷信息。
 * 如果问卷不存在、已被删除、未发布，则返回 404
 */
export const answerGetSurveyByID = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    /** @type {ResOneSurvey} */
    const resData = getRespondData()

    const id = Number(req.params.surveyId)
    if (!id || Number.isNaN(id)) {
        resData.status = STATUS_FAILED
        resData.msg = '问卷填写链接错误'
        res.status(404).send(resData)
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
    if (!survey.is_valid) {
        resData.status = STATUS_FAILED
        resData.msg = '问卷已经停止收集'
        res.status(404).send(resData)
        return
    }
    if (!surveyDetail) {
        resData.status = STATUS_FAILED
        resData.msg = '问卷内容不存在'
        res.status(404).send(resData)
        return
    }

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
