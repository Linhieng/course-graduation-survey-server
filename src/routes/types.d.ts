interface ResDataOneSurvey {
    id: number;
    title: string;
    comment: string;
    structure_json: SurveyStructureJson;
}
interface SurveyStructureJson {
    version: '0.2.0';
    questionList: Array<Record<string,any>>;
}
