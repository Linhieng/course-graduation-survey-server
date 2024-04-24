import { sqlGetUnreadMessage, sqlSetMessageStatus } from '../sql/message.js'
import { asyncHandler, getRespondData } from '../utils/index.js'


export const getUnreadMessage = asyncHandler(async (/** @type {import("express").Request} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    resData.data = await sqlGetUnreadMessage(req.auth.userId)
    res.send(resData)
})

export const setMessageRead = asyncHandler(async (/** @type {import("express").Request} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const change_num = req.query.change_num
    const id_arr_str = req.query.id_arr_str
    // if ()
    resData.data = await sqlSetMessageStatus(change_num, id_arr_str, 1)
    res.send(resData)
})
export const setMessageUnread = asyncHandler(async (/** @type {import("express").Request} */req, /** @type {ExpressResponse} */ res) => {
})
export const setMessageStatus = asyncHandler(async (/** @type {import("express").Request} */req, /** @type {ExpressResponse} */ res) => {
})
