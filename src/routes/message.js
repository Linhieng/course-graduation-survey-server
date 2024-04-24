import { sqlGetUnreadMessage, sqlSetMessageStatus } from '../sql/message.js'
import { Error4xx, asyncHandler, getRespondData } from '../utils/index.js'


export const getUnreadMessage = asyncHandler(async (/** @type {import("express").Request} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    resData.data = await sqlGetUnreadMessage(req.auth.userId)
    res.send(resData)
})

export const setMessageRead = asyncHandler(async (/** @type {import("express").Request} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const ids = req.body.ids
    if (Array.isArray(ids) && typeof ids[0] !== 'number') {
        throw new Error4xx(400, '参数错误')
    }
    resData.data = await sqlSetMessageStatus(ids, 1)
    res.send(resData)
})
export const setMessageUnread = asyncHandler(async (/** @type {import("express").Request} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const ids = req.body.ids
    if (Array.isArray(ids) && typeof ids[0] !== 'number') {
        throw new Error4xx(400, '参数错误')
    }
    resData.data = await sqlSetMessageStatus(ids, 0)
    res.send(resData)
})
export const setMessageStatus = asyncHandler(async (/** @type {import("express").Request} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const ids = req.body.ids
    const status = req.body.status
    if (Array.isArray(ids) && typeof ids[0] !== 'number') {
        throw new Error4xx(400, '参数错误')
    }
    resData.data = await sqlSetMessageStatus(ids, status)
    res.send(resData)
})
