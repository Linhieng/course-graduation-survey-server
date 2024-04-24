import { sqlGetCountStat, sqlStatGroupByDay, sqlStatSurveyClassifyEasy, sqlStatSurveyVisitGroupByDay } from '../sql/stat.js'
import { asyncHandler, getRespondData } from '../utils/index.js'

export const statCountStat = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    resData.data = await sqlGetCountStat(req.auth.userId)
    res.send(resData)
})

export const statGroupByDay = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    resData.data = await sqlStatGroupByDay(req.auth.userId)
    res.send(resData)
})

export const statVisitSurveyGroupByDay = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const day = Number(req.query.day) || undefined
    resData.data = await sqlStatSurveyVisitGroupByDay(day)
    res.send(resData)
})

/** 只获取问卷的数量信息，没有表格联查之类的。 */
export const statSurveyClassifyEasy = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const userId = req.auth.userId
    resData.data = await sqlStatSurveyClassifyEasy(userId)
    res.send(resData)
})
