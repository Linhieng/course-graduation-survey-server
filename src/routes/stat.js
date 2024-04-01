import { STATUS_FAILED } from '../constants/response.js'
import { getStatData } from '../sql/index.js'
import { asyncHandler, getRespondData } from '../utils/index.js'

/**
 * 填写一份问卷
 */
export const statData = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()

    const surveyId = Number(req.params.surveyId)
    if (!surveyId || Number.isNaN(surveyId)) {
        resData.status = STATUS_FAILED
        resData.msg = '请提供 surveyId'
        res.status(400).send(resData)
        return
    }
    const body = req.body
    const data = await getStatData(surveyId, body)
    resData.data = data

    res.send(resData)
})
