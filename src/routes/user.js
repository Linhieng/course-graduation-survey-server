import { CODE_FAILED, CODE_SUCCEED, STATUS_SUCCEED } from '../constants/index.js'
import { insertOne, selectPasswordByUsername } from "../sql/index.js"
import { asyncHandler, encrypt, getResponData } from "../utils/index.js"
import { signAuth } from "../auth/index.js"

/**
 * 能进入到这里，说明没有过期
 */
export const isAuthExpired = asyncHandler(async (req, res) => {
    const resData = getResponData()
    res.send(resData)
})


/**
 * 注册用户
 */
export const signup = asyncHandler(async (req, res) => {
    const resData = getResponData()
    /**
     * @type {ReqUserSignup}
     */
    const reqData = req.body
    const username = reqData.username
    const password = reqData.password
    const password_hash = encrypt(password)


    const result = await insertOne(username, password_hash)

    if (result === 'existed') {
        resData.status = 'failed'
        resData.code = 1
        resData.msg = '已经存在该用户'
        res.status(200).send(resData)
    } else if (result.affectedRows === 1) {
        resData.msg = '成功创建新用户'
        /**
         * @type {ResLoginData}
         */
        const data = {
            id: result.insertId,
            username
        }
        resData.data = data
        res.status(200).send(resData)
    }
})


/**
 * 用户登录
 */
export const login = asyncHandler(async (req, res) => {
    /**
     * @type {ReqUserLogin}
     */
    const reqData = req.body
    const resData = getResponData()
    const username = reqData.username
    const password = reqData.password
    const password_hash = encrypt(password)

    // execute 将在内部调用 prepare 和 query
    const result = await selectPasswordByUsername(username)

    if (result.length < 1) {
        resData.status = 'failed'
        resData.code = CODE_FAILED
        resData.msg = '账户不存在，请先注册'
        res.status(200).send(resData)
        return
    }

    const correct_password = result[0].password_hash
    if (password_hash !== correct_password) {
        resData.status = 'failed'
        resData.code = CODE_FAILED
        resData.msg = '密码错误'
        res.status(200).send(resData)
        return
    }

    // 生成 token 并分配到 cookie 中
    const userId = result[0].id
    signAuth(res, userId, username)


    /**
     * @type {ResLoginData}
     */
    const data = {
        id: result[0].id,
        username: result[0].username
    }
    resData.status = STATUS_SUCCEED
    resData.code = CODE_SUCCEED
    resData.msg = '登录成功'
    resData.data = data
    res.status(200).send(resData)
})
