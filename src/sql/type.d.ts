interface ChangePasswordData {
    oldPassword_hash: string
    newPassword_hash: string
}

/** js 中如何为我自定义的类提供类型说明？ */
declare class Error4xx {
    /** 返回的错误消息 */
    msg: string // 这里也可以提供枚举
    /** 错误状态码，肯定是 4 开头，常用的就是这几个了吧，大概 */
    statusCode: 400 | 401 | 402 | 403 | 404 | 405 // ...
}
