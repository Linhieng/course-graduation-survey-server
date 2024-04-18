import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { defaultHandler } from './utils/index.js'
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
} from './routes/index.js'
import cookieParser from 'cookie-parser'
import { midVerifyAuth } from './auth/token.js'

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

const mockDelay = (req, res, next) => {
    setTimeout(next, 1000)
}

app.post('/api/survey/create', mockDelay, createNewQuestionnaire)
app.post('/api/survey/cache', mockDelay, cacheQuestionnaire)
app.post('/api/user/signup', mockDelay, signup)
app.post('/api/user/login', mockDelay, login)
app.post('/api/user/logout', mockDelay, midVerifyAuth, logout)
app.get('/api/user/isAuthExpired', midVerifyAuth, midVerifyAuth, isAuthExpired)
app.get('/api/answer/:surveyId', mockDelay, answerGetSurveyByID)
app.post('/api/answer/:surveyId', mockDelay, answerAddOne)
app.get('/api/survey/get-all-surveys/:userId', mockDelay, midVerifyAuth, getAllQuestionnaires)
app.get('/api/survey/get-all-surveys', mockDelay, midVerifyAuth, getAllQuestionnaires)
app.get('/api/survey/id-:surveyId', mockDelay, midVerifyAuth, GetSurveyByID)


app.post('/survey/toggle-del/:surveyId', toggleSurveyDelete)
app.post('/survey/toggle-valid/:surveyId', toggleSurveyValid)

app.get('/stat/:surveyId', statData)

app.use(defaultHandler)

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
