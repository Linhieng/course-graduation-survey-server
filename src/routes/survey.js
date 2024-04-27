import { STATUS_FAILED } from '../constants/response.js'
import {
    sqlGetAllSurvey, sqlGetSurveyById, sqlPublishSurvey,
    sqlGetPublishSurvey,
    sqlGetDraftSurvey,
    sqlGetDelSurvey,
    sqlGetStopSurvey,
    sqlCreateNewSurvey, sqlUpdateSurvey, sqlGetSurveyStat,
    sqlStopSurvey, sqlDelSurvey, sqlRecoverSurvey,
    sqlUpdateAndPublishSurvey,
    sqlGetSurveyAllTemplate,
    sqlGetSurveyMyTemplate,
    sqlSetSurveyTemplateShare,
    sqlGetShareSurveyTemplate,
} from '../sql/survey.js'
import { Error4xx, asyncHandler, getRespondData } from '../utils/index.js'

/**
 * 缓存用户问卷，如果问卷不存在，则自动创建问卷。
 */
export const cacheQuestionnaire = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    /** @type {ResCacheSurvey} */
    const resData = getRespondData()

    /** @type {ReqSurveyAche} */
    const survey = req.body
    let surveyId = survey.id
    const userId = req.auth.userId

    if (!surveyId) {
        // 自动创建问卷
        surveyId = await sqlCreateNewSurvey({
            userId, title: survey.title, comment: survey.comment, structure_json: survey.structure_json,
            survey_type: survey.survey_type,
            is_template: survey.is_template,
        })
    } else {
        // TODO: 不允许编辑非草稿问卷。
        await sqlUpdateSurvey(surveyId, survey.title, survey.comment, survey.structure_json)
    }

    resData.data = {
        surveyId,
        time: new Date(),
    }
    res.send(resData)
})
/**
 * 缓存/更新用户问卷，同时直接发布
 */
export const updateAndPublishSurvey = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    /** @type {ResCacheSurvey} */
    const resData = getRespondData()

    /** @type {ReqSurveyAche} */
    const survey = req.body
    let surveyId = survey.id
    const userId = req.auth.userId

    if (!surveyId) {
        // 自动创建问卷
        surveyId = await sqlCreateNewSurvey(userId, survey.title, survey.comment, survey.structure_json)
    }

    // TODO: 不允许编辑非草稿问卷。
    await sqlUpdateAndPublishSurvey(surveyId, survey.title, survey.comment, survey.structure_json)

    resData.data = {
        surveyId,
        time: new Date(),
    }
    res.send(resData)
})


/**
 * 根据问卷 id 获取问卷信息
 * 只能获取用户自己的，或者是特殊的用户的，比如 id 为 1 的用户
 */
export const getSurveyById = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()

    const id = Number(req.params.surveyId)
    if (Number.isNaN(id)) {
        resData.status = STATUS_FAILED
        resData.msg = '问卷id格式错误'
        res.status(422).send(resData)
        return
    }

    const result = await sqlGetSurveyById(id)
    if (result === 'Not Found') {
        resData.status = STATUS_FAILED
        resData.msg = '不存在此问卷'
        res.status(404).send(resData)
        return
    }

    const survey = result[0]
    const surveyDetail = result[1]

    if (survey.creator_id !== 1 && survey.creator_id !== req.auth.userId) {
        resData.status = STATUS_FAILED
        resData.msg = '无权限获取此问卷'
        res.status(403).send(resData)
        return
    }

    const surveyData = {
        // 这里直接全部返回，后续修改 survey 表时就不会报错，一个一个属性的写法不行！
        ...survey,
        structure_json: surveyDetail.structure_json,
    }
    resData.data = surveyData

    res.send(resData)
})


/**
 * 根据问卷 id 获取问卷信息
 * 取出一份问卷继续编辑，只能是草稿问卷！
 * 只能获取用户自己的，或者是特殊的用户的，比如 id 为 1 的用户
 */
export const getSurveyForEdit = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()

    const id = Number(req.params.surveyId)
    if (Number.isNaN(id)) {
        resData.status = STATUS_FAILED
        resData.msg = '问卷id格式错误'
        res.status(422).send(resData)
        return
    }

    const result = await sqlGetSurveyById(id)
    if (result === 'Not Found') {
        resData.status = STATUS_FAILED
        resData.msg = '不存在此问卷'
        res.status(404).send(resData)
        return
    }

    const survey = result[0]
    const surveyDetail = result[1]

    if (survey.creator_id !== 1 && survey.creator_id !== req.auth.userId) {
        resData.status = STATUS_FAILED
        resData.msg = '无权限获取此问卷'
        res.status(403).send(resData)
        return
    }

    if (!survey.is_draft) {
        resData.status = STATUS_FAILED
        resData.msg = '不允许编辑非草稿问卷'
        res.status(200).send(resData)
        return
    }

    /** @type {ResDataOneSurvey} */
    const surveyData = {
        id: survey.id,
        title: survey.title,
        comment: survey.comment,
        structure_json: surveyDetail.structure_json,
    }
    resData.data = surveyData


    res.send(resData)
})

/**
 * 获取问卷总的数量，以及他们所对应的回答数量，并进行划分：草稿、发布中、已停止、已删除。
 */
export const getSurveyStat = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const userId = req.auth.userId

    const statData = await sqlGetSurveyStat(userId)

    resData.data = statData
    res.send(resData)
})

/**
 * 获取当前用户的所有问卷，包含已经被标记为删除的。
 *
 * @param {ExpressRequest} req
 * @param {ExpressResponse} res
 */
export const getAllSurvey = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const userId = req.auth.userId
    const all_surveys = await sqlGetAllSurvey(userId)
    resData.data = { all_surveys }
    res.send(resData)
})





export const getPublishSurvey = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const userId = req.auth.userId
    resData.data = await sqlGetPublishSurvey(userId)
    res.send(resData)
})
export const getDraftSurvey = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const userId = req.auth.userId
    resData.data = await sqlGetDraftSurvey(userId)
    res.send(resData)
})
export const getDelSurvey = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const userId = req.auth.userId
    resData.data = await sqlGetDelSurvey(userId)
    res.send(resData)
})
export const getStopSurvey = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const userId = req.auth.userId
    resData.data = await sqlGetStopSurvey(userId)
    res.send(resData)
})
export const getAllSurveyClassify = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const userId = req.auth.userId
    resData.data = {
        publish: await sqlGetPublishSurvey(userId),
        draft: await sqlGetDraftSurvey(userId),
        del: await sqlGetDelSurvey(userId),
        stop: await sqlGetStopSurvey(userId),
    }
    res.send(resData)
})








// TODO: 下面这几个几乎都是重复的。
/**
 * 发布问卷
 */
export const publishSurvey = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()

    const surveyId = Number(req.params.surveyId)
    if (Number.isNaN(surveyId)) {
        resData.status = STATUS_FAILED
        // 请提供问卷 id
        resData.msg = 'api.error.not-survey-id'
        res.status(400).send(resData)
        return
    }

    const result = await sqlPublishSurvey(surveyId)
    if (result === 'Not Found') {
        resData.status = STATUS_FAILED
        // 不存在此问卷
        resData.msg = 'api.error.survey-not-exist'
        res.status(400).send(resData)
        return
    }

    res.send(resData)
})
/**
 * 停止问卷的收集
 */
export const stopSurvey = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()

    const surveyId = Number(req.params.surveyId)
    if (Number.isNaN(surveyId)) {
        resData.status = STATUS_FAILED
        // 请提供问卷 id
        resData.msg = 'api.error.not-survey-id'
        res.status(400).send(resData)
        return
    }

    const result = await sqlStopSurvey(surveyId)
    if (result === 'Not Found') {
        resData.status = STATUS_FAILED
        // 不存在此问卷
        resData.msg = 'api.error.survey-not-exist'
        res.status(400).send(resData)
        return
    }

    res.send(resData)
})
/**
 * 删除某个问卷
 */
export const delSurvey = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()

    const surveyId = Number(req.params.surveyId)
    if (Number.isNaN(surveyId)) {
        resData.status = STATUS_FAILED
        // 请提供问卷 id
        resData.msg = 'api.error.not-survey-id'
        res.status(400).send(resData)
        return
    }

    const result = await sqlDelSurvey(surveyId)
    if (result === 'Not Found') {
        resData.status = STATUS_FAILED
        // 不存在此问卷
        resData.msg = 'api.error.survey-not-exist'
        res.status(400).send(resData)
        return
    }

    res.send(resData)
})
/**
 * 恢复某个问卷
 */
export const recoverSurvey = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()

    const surveyId = Number(req.params.surveyId)
    if (Number.isNaN(surveyId)) {
        resData.status = STATUS_FAILED
        // 请提供问卷 id
        resData.msg = 'api.error.not-survey-id'
        res.status(400).send(resData)
        return
    }

    const result = await sqlRecoverSurvey(surveyId)
    if (result === 'Not Found') {
        resData.status = STATUS_FAILED
        // 不存在此问卷
        resData.msg = 'api.error.survey-not-exist'
        res.status(400).send(resData)
        return
    }

    res.send(resData)
})


export const getSurveyMyTemplate = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const pageStart = Number(req.query.pageStart)
    const pageSize = Number(req.query.pageSize)
    if (isNaN(pageStart) || isNaN(pageSize)) {
        throw new Error4xx(400, '请求的分页参数格式错误')
    }
    resData.data = await sqlGetSurveyMyTemplate(req.auth.userId, pageStart, pageSize)
    res.send(resData)
})
export const getSurveyAllTemplate = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const pageStart = Number(req.query.pageStart)
    const pageSize = Number(req.query.pageSize)
    if (isNaN(pageStart) || isNaN(pageSize)) {
        throw new Error4xx(400, '请求的分页参数格式错误')
    }
    resData.data = await sqlGetSurveyAllTemplate(pageStart, pageSize)
    res.send(resData)
})

export const setSurveyTemplateShare = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const surveyId = Number(req.params.surveyId)
    if (isNaN(surveyId)) {
        throw new Error4xx(400, '问卷 id 格式错误')
    }
    resData.data = await sqlSetSurveyTemplateShare(req.auth.userId, surveyId, 2)
    res.send(resData)
})
export const setSurveyTemplateUnshare = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const surveyId = Number(req.params.surveyId)
    if (isNaN(surveyId)) {
        throw new Error4xx(400, '问卷 id 格式错误')
    }
    resData.data = await sqlSetSurveyTemplateShare(req.auth.userId, surveyId, 1)
    res.send(resData)
})
export const toggleSurveyTemplateUnshare = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const surveyId = Number(req.params.surveyId)
    if (isNaN(surveyId)) {
        throw new Error4xx(400, '问卷 id 格式错误')
    }
    resData.data = await sqlSetSurveyTemplateShare(req.auth.userId, surveyId)
    res.send(resData)
})
export const getShareSurveyTemplate = asyncHandler(async (/** @type {ExpressRequest} */req, /** @type {ExpressResponse} */ res) => {
    const resData = getRespondData()
    const surveyId = Number(req.params.surveyId)
    if (isNaN(surveyId)) {
        throw new Error4xx(400, '问卷 id 格式错误')
    }
    resData.data = await sqlGetShareSurveyTemplate(req.auth.userId, surveyId)
    res.send(resData)
})
