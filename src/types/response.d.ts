/**
 * @file 接口响应体类型说明，主要用于定义 data 类型说明
 */


/** 只有符合理想情况时才会设置为该值 */
type StatusSucceed = typeof import('../constants/response.js').STATUS_SUCCEED
/** 任何不符合理想情况，都设置为 StatusFailed */
type StatusFailed = typeof import('../constants/response.js').STATUS_FAILED

/**
 * 响应的状态，只提供两种！
 */
type TypeResStatus = StatusSucceed | StatusFailed


/**
 * - 成功
 */
type TypeResCodeSucceed = typeof import('../constants/response.js').CODE_SUCCEED
/**
 * - 操作失败，同时我能知道为什么该操作失败。比如注册时用户名已存在
 */
type TypeResCodeFailed = typeof import('../constants/response.js').CODE_FAILED
/**
 * - 操作错误，同时我能知道为什么错误。比如我识别到请求参数格式错误，
 *      通常是 catch 时匹配到我期待的错误类型。
 */
type TypeResCodeError = typeof import('../constants/response.js').CODE_ERROR
/**
 * - 未知错误，我不知道为什么出错
 */
type TypeResCodeUnknownError = typeof import('../constants/response.js').CODE_UNKNOWN_ERROR
/**
 * 自定的返回码，对操作结果进一步细分。这些数值需要与 constants/response.js 中的 CODE_xx 相对应。
 * 目前来说，这四个值已经足够满足需求了，所以没有特殊情况的话不要再修改
 *  - 操作成功 (0)
 *  - 操作失败 (1)
 *  - 操作错误 (2)
 *  - 未知错误 (3)
 */
type TypeResCode =
    TypeResCodeSucceed |
    TypeResCodeFailed |
    TypeResCodeError |
    TypeResCodeUnknownError

/**
 * 响应数据时的通用包装器
 */
interface ResWrapper<T extends Object> {
    status: TypeResStatus
    code: TypeResCode
    msg: string
    data: T
}

/**
 * 登录接口响应的数据
 */
interface ResLoginData {
    userId: TypeID
    /** jwt 生成的 token */
    token: string
    username: string
}
type ResLogin = ResWrapper<ResLoginData>

/**
 * 注册接口响应的数据
 */
interface ResSignupData {
    id: TypeID
    username: string
}
type ResSignup = ResWrapper<ResSignupData>


type ResGetAllSurveyData = SchemaQuestionnaire

/**
 * 缓存文件时响应的数据
 */
interface ResCacheSurveyData {
    time: Date
}
type ResCacheSurvey = ResWrapper<ResCacheSurveyData>

/**
 * 获取单份问卷信息返回的响应数据
 */
interface ResOneSurveyData {
    id: TypeID
    title: string
    comment: string
    questions: Object
}
type ResOneSurvey = ResWrapper<ResOneSurveyData>

/**
 * 统计数据时响应的数据
 */
type AnswerData = SchemaQuestionnaireAnswer & SchemaQuestionnaireAnswerDetail
type SurveyData = SchemaQuestionnaire & SchemaQuestionnaireDetail
interface ResStatData {
    surveyData: SurveyData
    answersData: Array<AnswerData>
}
type ResStatData = ResWrapper<ResStatData>
