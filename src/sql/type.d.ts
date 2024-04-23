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

interface SearchSurveyListByPageParams {
    userId: TypeID,
    pageStart: number,
    pageSize: number,
    /** 空字符串表示不设条件 */
    survey_name: string | '',
    survey_desc: string | '',
    survey_status: 'all' | 'publish' | 'stop',
    survey_create_range: [number, number],
}
/** 分页 + 条件搜索时，应该返回的数据格式 */
interface CollectSurveyItem {
    id: number;
    title: string;
    comment: string;
    is_valid: boolean;
    created_at: Date;
    updated_at: Date;
    /** 收集到的回答量 */
    collect_answer: number;
    /** 收集到的访问量 */
    collect_visited: number;
}
