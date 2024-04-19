import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { defaultHandler, getRespondData } from './utils/index.js'
import { initConnPool } from './sql/index.js'
import {
    getAllQuestionnaires,
    login,
    signup,
    isAuthExpired,
    createNewQuestionnaire,
    cacheQuestionnaire,
    GetSurveyByID,
    answerGetSurveyByID,
    toggleSurveyDelete,
    toggleSurveyValid,
    answerAddOne,
    statData,
    logout,
    publishSurvey,
    getUserInfo,
} from './routes/index.js'
import cookieParser from 'cookie-parser'
import { midVerifyAuth } from './auth/token.js'
import { CODE_ERROR } from './constants/response.js'

const port = 3000
const app = express()
initConnPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'survey',
})

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
app.use('/static', express.static('src/public'))

const mockDelay = (req, res, next) => {
    setTimeout(next, 1000)
}

// 用户
app.post('/api/user/login', mockDelay, login)
app.post('/api/user/signup', mockDelay, signup)
app.post('/api/user/logout', mockDelay, midVerifyAuth, logout)
app.get('/api/user/isAuthExpired', midVerifyAuth, midVerifyAuth, isAuthExpired)
app.post('/api/user/info', mockDelay, midVerifyAuth, getUserInfo)

// 问卷
app.post('/api/survey/create', mockDelay, createNewQuestionnaire)
app.post('/api/survey/cache', mockDelay, cacheQuestionnaire)
app.get('/api/survey/get-all-surveys/:userId', mockDelay, midVerifyAuth, getAllQuestionnaires)
app.get('/api/survey/get-all-surveys', mockDelay, midVerifyAuth, getAllQuestionnaires)
app.get('/api/survey/id-:surveyId', mockDelay, midVerifyAuth, GetSurveyByID)
app.post('/api/survey/publish/:surveyId', mockDelay, midVerifyAuth, publishSurvey)

// 回答
app.get('/api/answer/:surveyId', mockDelay, answerGetSurveyByID)
app.post('/api/answer/:surveyId', mockDelay, answerAddOne)

app.post('/survey/toggle-del/:surveyId', toggleSurveyDelete)
app.post('/survey/toggle-valid/:surveyId', toggleSurveyValid)

app.get('/stat/:surveyId', statData)

app.all('*', (req, res) => {
    const resData = getRespondData('failed', CODE_ERROR, 'api.error.url.404')
    res.status(404).send(resData)
})

app.use(defaultHandler)

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
