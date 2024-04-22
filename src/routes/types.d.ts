interface ReqBodyAnswer {
    surveyId: number,
    /** 回答者 id */
    userId?: number,
    /** 单位秒 */
    spendTime?: number,
    answerStructureJson: Record<string, nay>
}


interface ResDataSurveyStatInfo {
    all_survey_count: number
    draft_survey_count: number
    publish_survey_count: number
    stop_survey_count: number
    del_survey_count: number
    /** 累计收到的所有回答数量 */
    total_answer_count: number
    /** 各个问卷对应的答案数量 */
    all_survey_info: Record<number, {
        surveyId: number,
        title: string,
        answer_count: number
    }>
}


interface ResDataOneSurvey {
    id: number;
    title: string;
    comment: string;
    structure_json: SurveyStructureJson;
}
interface SurveyStructureJson {
    version: '0.2.0';
    questionList: Array<Record<string, any>>;
}
