/**
 * @file 该文件中的类型对应 mysql 数据库中的表对象
 */

/**
 * 表 ID 的类型
 */
declare type TypeID = number

/**
 * 每张表都有的基本信息
 */
declare interface SchemaBase {
    id: TypeID
    created_at: Date
    updated_at: Date
}

/**
 * user 表中的状态
 */
declare enum SchemaUserStatus {
    /**
     * 特殊，专为匿名用户服务
     */
    anonymity = -1,
    /**
     * 账户状态正常
     */
    normal = 0,
    /**
     * 账户被锁定/被封
     */
    blocked = 1
}

/**
 * user 表中的所有用户类型
 */
declare enum SchemaUserType {
    /**
     * 特殊，特指匿名用户
     */
    anonymity = -1,
    /**
     * 普通用户/注册用户
     */
    common_user = 0,
    /**
     * 管理员用户
     */
    admin = 1
}

/**
 * 表中的通用布尔值类型，在数据库中使用 tinyint
 */
declare enum SchemaCommonBoolean {
    NO = 0,
    YES = 1
}

/**
 * 用户信息表
 */
interface SchemaUser extends SchemaBase {
    /** - 用户名，唯一 */
    username: string
    /** - 邮箱，可选 */
    email: string
    /** - 使用 SHA256 加密后的密码 */
    password_hash: string
    /** - 账户状态 */
    status: SchemaUserStatus
    /** - 用户类型 */
    user_type: SchemaUserType
}

/**
 * 问卷通用信息表
 */
interface SchemaQuestionnaire extends SchemaBase {
    /** - 问卷标题 */
    title: string
    /** - 问卷备注 */
    comment: string
    /** - 问卷排序，0 的优先级最低，表示按时间排序 */
    sort_order: number
    /** - 创建人 */
    creator_id: TypeID
    /** - 是否是草稿，未发布时就是草稿，发布后不能重新更改为草稿 */
    is_draft: SchemaCommonBoolean
    /** - 是否有效，发布后如果停止收集，即为无效，否则为有效 */
    is_valid: SchemaCommonBoolean
    /** - 是否已删除，删除表示移入回收站 */
    is_deleted: SchemaCommonBoolean
}

/**
 * 问卷约束信息表
 */
interface SchemaQuestionnaireConstrain extends SchemaBase {
    /** - 所属问卷 */
    questionnaire_id: TypeID
    /** - 是否匿名收集 */
    is_anonymity: SchemaCommonBoolean
    /** - 是否强制登录，才可回答问卷 */
    force_login: SchemaCommonBoolean
}

/**
 * 问卷具体内容信息表
 * 使用 JSON 格式存储
 */
interface SchemaQuestionnaireDetail extends SchemaBase {
    /** - 所属问卷 */
    questionnaire_id: TypeID
    /** - 具体数据，格式为 json 字符串 */
    structure_json: Object
}

/**
 * 问卷回答基本信息表
 */
interface SchemaQuestionnaireAnswer extends SchemaBase {
    /** - 所属问卷 */
    questionnaire_id: TypeID
    /** - 回答人 */
    answer_user_id: TypeID
    /** - 是否有效。用户可以将某些回答标记为无效回答 */
    is_valid: SchemaCommonBoolean
    /** - 填写问卷的花费时间（单位秒） -1 表示不统计 */
    spend_time: number
    /** - 回答人的 IP 来源 */
    ip_from: string
}

/**
 * 问卷回答具体内容信息表
 */
interface SchemaQuestionnaireAnswerDetail extends SchemaBase {
    /** - 所属回答 id */
    answer_id: TypeID
    /** - 具体内容，格式为 json */
    structure_json: Object
}


interface SchemaUserInfo extends SchemaBase {
    "account_id": TypeID
    "name": string
    "avatar_url": string
    "email": string
    "job": string
    "job_name": string
    "organization": string
    "organization_name": string
    "location": string
    "location_name": string
    "introduction": string
    "personal_website": string
    "phone": string
    /** 是否已认证身份 */
    "certification": 0 | 1
    /** 0 表示 admin，1 表示 user */
    "role": 1 | 0
    "registration_date": Date
}
