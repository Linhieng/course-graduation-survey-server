import { CODE_FAILED, CODE_SUCCEED, STATUS_SUCCEED } from '../constants/index.js'
import { insertOne, selectPasswordByUsername, sqlCHangePassword, sqlGetUserInfo, sqlGetUserLog, sqlUpdateUserInfo } from '../sql/index.js'
import { userActionLog, asyncHandler, encrypt, getRespondData, Error4xx } from '../utils/index.js'
import { addRevokedToken, signAuth } from '../auth/index.js'
import convertToCamelCase from '../utils/camelCase.js'

/**
 * 获取用户头像，这是公开的接口
 */
export const getUserAvatar = asyncHandler(async (/** @type {import('express').Request} */ req, res) => {
    const userId = Number(req.params.userId)
    if (isNaN(userId)) {
        throw new Error4xx(400, '用户 id 错误')
    }
    const user = await sqlGetUserInfo(userId)

    const resData = getRespondData()
    resData.data = { avatar: user.avatar }
    res.send(resData)
})

export const getActionLog = asyncHandler(async (/** @type {import('express').Request} */ req, res) => {
    let { startPage, pageSize } = req.query
    startPage = isNaN(Number(startPage)) ? undefined : Number(startPage)
    pageSize = isNaN(Number(pageSize)) ? undefined : Number(pageSize)
    const data = await sqlGetUserLog(req.auth.userId, startPage, pageSize)
    const resData = getRespondData()
    resData.data = data
    res.send(resData)
})

/**
 * 修改密码
 */
export const modifyPassword = asyncHandler(async (/** @type {import('express').Request} */ req, res) => {
    const oldPassword_hash = encrypt(req.body.oldPassword)
    const newPassword_hash = encrypt(req.body.newPassword)
    await sqlCHangePassword(req.auth, {
        oldPassword_hash,
        newPassword_hash,
    })

    userActionLog(req.auth.userId, req, '修改密码')

    const resData = getRespondData()
    res.send(resData)
})

/**
 * 更新用户信息
 */
export const updateUserInfo = asyncHandler(async (/** @type {import('express').Request} */ req, res) => {
    await sqlUpdateUserInfo(req.auth.userId, req.body)
    const resData = getRespondData()
    res.send(resData)
})

/**
 * 返回用户信息
 * @return {{userId:number;username:string}}
 */
export const getUserInfo = asyncHandler(async (/** @type {import('express').Request} */ req, res) => {
    const resData = getRespondData()
    const info = await sqlGetUserInfo(req.auth.userId)

    if (info === 'not') {
        resData.status = 'failed'
        resData.msg = 'api.error.not-user-info'
        res.status(400).send(resData)
        return
    }
    info.role = info.role === 1 ? 'user' : 'admin'
    resData.data = convertToCamelCase(info)
    resData.data.username = req.auth.username
    res.send(resData)
})

/**
 * 能进入到这里，说明没有过期
 */
export const isAuthExpired = asyncHandler(async (req, res) => {
    const resData = getRespondData()
    res.send(resData)
})


/**
 * 注册用户
 */
export const signup = asyncHandler(async (req, res) => {
    const resData = getRespondData()
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
        // 已经存在该用户
        resData.msg = 'api.warn.had-user'
        res.status(200).send(resData)
    } else if (result.affectedRows === 1) {
        resData.msg = 'api.success.create-user'
        /**
         * @type {ResLoginData}
         */
        const data = {
            id: result.insertId,
            username,
        }
        resData.data = data
        res.status(200).send(resData)
    } else {
        // 这里还能有其他情况吗？
        resData.msg = 'api.error.unknown'
        res.status(500).send(resData)
    }
})

export const logout = asyncHandler(async (/** @type {import("express").Request} */ req, res) => {
    // 记录日志，无需处理报错
    userActionLog(req.auth.userId, req, '退出登录')

    const resData = getRespondData()
    addRevokedToken(req.auth)
    res.send(resData)
})

/**
 * 用户登录
 */
export const login = asyncHandler(async (req, res) => {
    /**
     * @type {ReqUserLogin}
     */
    const reqData = req.body
    const resData = getRespondData()
    const username = reqData.username
    // 前端应该加密后再将密码传递过来，前端加密的目的不是为了防止被截取，而是为了不让人知道原密码是什么
    // 防止被截取，这一功能是由 https 提供的，不是加密提供的。
    const password = reqData.password
    const password_hash = encrypt(password)

    // execute 将在内部调用 prepare 和 query
    const result = await selectPasswordByUsername(username)

    if (result.length < 1) {
        resData.status = 'failed'
        resData.code = CODE_FAILED
        // '账户不存在，请先注册'
        resData.msg = 'api.response.not-found-account'
        res.status(200).send(resData)
        return
    }

    const correct_password = result[0].password_hash
    if (password_hash !== correct_password) {
        resData.status = 'failed'
        resData.code = CODE_FAILED
        // 密码错误
        resData.msg = 'api.error.password-wrong'
        res.status(200).send(resData)
        return
    }

    // 生成 token 并分配到 cookie 中
    const userId = result[0].id
    const token = signAuth(res, userId, username)

    // 记录日志，无需处理报错
    userActionLog(userId, req, '登录')

    /**
     * @type {ResLoginData}
     */
    const data = {
        userId,
        token,
        // username: result[0].username,
    }
    resData.status = STATUS_SUCCEED
    resData.code = CODE_SUCCEED
    // 登录成功
    resData.msg = 'api.success.login-ok'
    resData.data = data
    res.status(200).send(resData)
})
