/**
 * @file 接口请求的参数类型说明，通常是对 json 对象的说明
 */

/**
 * 用户登录时需要的请求参数
 */
interface ReqUserLogin {
    username: string
    password: string
}

/**
 * 用户注册时需要的请求参数
 */
interface ReqUserSignup {
    username: string
    password: string
    email?: string
}

/**
 * 定时缓存用户创建的问卷信息
 */
interface ReqSurveyAche {
    id: TypeID
    title: string
    comment: string

    structure_json: Object
}

/**
 * 用户填写问卷时的请求体
 */
interface ReqSurveyAnswer {
    surveyId: TypeID
    answerUserId: TypeID
    /** 单位秒 */
    spendTime: number
    /** 问题回答的内容，数据库中仅保存，不解析 */
    answerDetail: Object
}
