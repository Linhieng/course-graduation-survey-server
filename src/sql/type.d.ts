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



/** 分页+条件的请求参数，和前一个类似，但有些许差别 */
interface SearchSurveyByPageParams {
    userId: TypeID;
    pageStart: number;
    pageSize: number;

    /** 未定义表示不设置条件 */
    title?: string;
    comment?: string;
    /** 不设置表示所有。问卷类型。0 常规问卷，1 调研问卷，2 心理问卷 */
    survey_type?: number;
    /** 不设置表示所有。状态：0 表示删除，1 表示草稿，2 表示发布，3 表示停止 */
    status?: number;
    /** 不设置表示所有。0 表示非模版，1 表示私有模版，2 表示公有模版 */
    is_template?: number;
    /** 不设置表示所有。创建时间范围 */
    created_range?: [number, number];
    /** 不设置表示所有。更新时间范围 */
    updated_range?: [number, number];
    /** 根据什么进行排序 */
    order_by:
        Array<'updated_at' | 'created_at' | 'collect_visited' | 'collect_answer'>
        | 'updated_at' | 'created_at' | 'collect_visited' | 'collect_answer'
    /** 排序方式，升序还是降序 */
    order_type: 'DESC' | 'ASC'
}
