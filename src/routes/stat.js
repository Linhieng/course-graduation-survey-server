import { sqlGetCountStat, sqlStatGroupByDay } from '../sql/stat.js'
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
