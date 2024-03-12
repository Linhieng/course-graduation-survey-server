/**
 * - 成功
 */
export const CODE_SUCCEED = 0
/**
 * - 操作失败，同时我能知道为什么该操作失败。比如注册时用户名已存在
 */
export const CODE_FAILED = 1
/**
 * - 操作错误，同时我能知道为什么错误。比如我识别到请求参数格式错误，
 *      通常是 catch 时匹配到我期待的错误类型。
 */
export const CODE_ERROR = 2
/**
 * - 未知错误，我不知道为什么出错
 */
export const CODE_UNKNOWN_ERROR = 3

/**
 * - 只有符合理想情况时才会设置为该值
 */
export const STATUS_SUCCEED = 'succeed'
/**
 * - 任何不符合理想情况，都设置为 failed
 */
export const STATUS_FAILED = 'failed'
