import fs from 'node:fs'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { defaultHandler, getRespondData } from './utils/index.js'
import { initConnPool } from './sql/index.js'
import {
    getAllSurvey,
    login,
    signup,
    isAuthExpired,
    cacheQuestionnaire,
    answerGetSurveyByID,
    answerAddOne,
    logout,
    publishSurvey,
    getUserInfo,
    updateUserInfo,
    modifyPassword,
    uploadFile,
    getActionLog,
    getSurveyById,
    getSurveyForEdit,
    getSurveyStat,
    stopSurvey,
    delSurvey,
    recoverSurvey,
    getPublishSurvey,
    getDraftSurvey,
    getDelSurvey,
    getStopSurvey,
    getAllSurveyClassify,
    updateAndPublishSurvey,
    statCountStat,
    statGroupByDay,
    statVisitSurveyGroupByDay,
    statSurveyClassifyEasy,
    statPopularSurveyCountAnswer,
    getSurveyAllTemplate,
    getSurveyMyTemplate,
    getUserAvatar,
    setSurveyTemplateShare,
    setSurveyTemplateUnshare,
    toggleSurveyTemplateUnshare,
    getShareSurveyTemplate,
    answerToggleValid,
} from './routes/index.js'
import cookieParser from 'cookie-parser'
import { CODE_ERROR } from './constants/response.js'
import { useExpressJwt } from './auth/index.js'
import multer from 'multer'
import { statVisit } from './mid/stat.js'
import { collectGetSurveyByID, collectGetSurveyByIDPage, searchSurveyListByPage } from './routes/collect.js'
import { getUnreadMessage, setMessageRead, setMessageStatus, setMessageUnread } from './routes/message.js'

const port = 3000
const app = express()
initConnPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'survey',
})

if (!fs.existsSync('src/auth/revokedToken')) {
    fs.appendFileSync('src/auth/revokedToken', '')
}

// 捕获全局未处理的 Promise rejection
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// 配置跨域问题，此时使用 nginx 进行反向代理
app.use(cors())
// 填充 req.body 参数
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
// 解析 cookie
app.use(cookieParser())
// 静态文件
app.use('/assets/public', express.static('src/public'))
// 使用 jwt token 校验
useExpressJwt(app)

// 记录每一条请求。只有鉴权通过才会到这里。
app.use(statVisit)

const mockDelay = (req, res, next) => {
    setTimeout(next, 2000)
}

const upload = multer()
app.post('/api/other/upload-public', upload.single('file'), mockDelay, uploadFile)

// 用户
app.post('/api/user/login', mockDelay, login)
app.post('/api/user/signup', mockDelay, signup)
app.post('/api/user/logout', mockDelay, logout)
app.get('/api/user/isAuthExpired', isAuthExpired)
app.post('/api/user/info', mockDelay, getUserInfo)
app.post('/api/user/update-info', mockDelay, updateUserInfo)
app.post('/api/user/modify-password', mockDelay, modifyPassword)
app.post('/api/user/action-log', mockDelay, getActionLog)
app.get('/api/user/get-avatar/:userId', mockDelay, getUserAvatar)


// 问卷
app.post('/api/survey/cache', mockDelay, cacheQuestionnaire)
app.get('/api/survey/get/:surveyId', mockDelay, getSurveyById)
app.get('/api/survey/get-for-edit/:surveyId', mockDelay, getSurveyForEdit)
app.get('/api/survey/get-all-surveys', mockDelay, getAllSurvey)
app.get('/api/survey/stat', mockDelay, getSurveyStat)
app.post('/api/survey/update-publish', mockDelay, updateAndPublishSurvey)
// TODO: 重复：
app.get('/api/survey/get-publish', mockDelay, getPublishSurvey)
app.get('/api/survey/get-draft', mockDelay, getDraftSurvey)
app.get('/api/survey/get-del', mockDelay, getDelSurvey)
app.get('/api/survey/get-stop', mockDelay, getStopSurvey)
app.get('/api/survey/all-classify', mockDelay, getAllSurveyClassify)
// TODO: 这几个几乎全是重复的……
app.post('/api/survey/publish/:surveyId', mockDelay, publishSurvey)
app.post('/api/survey/stop/:surveyId', mockDelay, stopSurvey)
app.post('/api/survey/del/:surveyId', mockDelay, delSurvey)
app.post('/api/survey/recover/:surveyId', mockDelay, recoverSurvey)
// 获取问卷模版
app.get('/api/survey/my-template', mockDelay, getSurveyMyTemplate)
app.get('/api/survey/all-template', mockDelay, getSurveyAllTemplate)
// 这个 api 也可以用于设置问卷为模版
app.post('/api/survey/template/set-share/:surveyId', mockDelay, setSurveyTemplateShare)
app.post('/api/survey/template/set-unshare/:surveyId', mockDelay, setSurveyTemplateUnshare)
app.post('/api/survey/template/toggle-share/:surveyId', mockDelay, toggleSurveyTemplateUnshare)
app.post('/api/survey/get-share-template/:surveyId', mockDelay, getShareSurveyTemplate)


// 回答
app.post('/api/answer/set-valid', mockDelay, answerToggleValid)
app.get('/api/answer/:surveyId', mockDelay, answerGetSurveyByID)
app.post('/api/answer/:surveyId', mockDelay, answerAddOne)

// 统计相关
app.get('/api/stat/count-stat', mockDelay, statCountStat)
app.get('/api/stat/group-by-day', mockDelay, statGroupByDay)
app.get('/api/stat/visit-survey-group-by-day', mockDelay, statVisitSurveyGroupByDay)
app.get('/api/stat/survey-classify-easy', mockDelay, statSurveyClassifyEasy)
app.get('/api/stat/popular-survey-count-answer', mockDelay, statPopularSurveyCountAnswer)

// 收集到的回答
app.get('/api/collect/:surveyId', mockDelay, collectGetSurveyByID)
// 这里得在前面！很明显这个路由设计得不好
app.get('/api/collect/page/survey_list', mockDelay, searchSurveyListByPage)
app.get('/api/collect/page/:surveyId', mockDelay, collectGetSurveyByIDPage)

// 获取用户消息列表
app.get('/api/message/unread', mockDelay, getUnreadMessage)
app.post('/api/message/set-read', mockDelay, setMessageRead)
app.post('/api/message/set-unread', mockDelay, setMessageUnread)
app.post('/api/message/set-status', mockDelay, setMessageStatus)

app.all('*', (req, res) => {
    const resData = getRespondData('failed', CODE_ERROR, 'api.error.url.404')
    res.status(404).send(resData)
})

app.use(defaultHandler)

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
