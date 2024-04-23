import { sqlCollectGetSurveyByID } from '../sql/collect.js'
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
