import { asyncHandler, getRespondData } from '../utils/index.js'
import fs from 'fs'
import { createHash } from 'node:crypto'
import { extname } from 'path'

/**
 * 上传一个文件，并返回对应 url 地址。
 */
export const uploadFile = asyncHandler(async (/** @type {import("express").Request} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const hash = md5(req.file.buffer)
    const filename = hash + extname(req.file.originalname)
    const filepath = 'src/public/' + filename
    if (!fs.existsSync(filepath)) {
        fs.appendFileSync(filepath, req.file.buffer, '')
    }
    resData.data = {
        url: 'http://localhost:3000/assets/public/' + filename,
    }
    res.send(resData)
})

function md5(content) {
    return createHash('md5').update(content).digest('hex')
}
