import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { defaultHandler } from './utils/index.js'
import { initConnPool } from './sql/index.js'
import { getAllQuestionnaires, login, signup, isAuthExpired, createNewQuestionnaire, cacheQuestionnaire, GetSurveyByID, answerGetSurveyByID, toggleSurveyDelete, toggleSurveyValid } from './routes/index.js'
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

app.get('/survey/get-all-surveys', getAllQuestionnaires)
app.post('/survey/create', createNewQuestionnaire)
app.post('/survey/cache', cacheQuestionnaire)
app.get('/survey/id-:surveyId', GetSurveyByID)
app.post('/survey/toggle-del/:surveyId', toggleSurveyDelete)
app.post('/survey/toggle-valid/:surveyId', toggleSurveyValid)
app.post('/user/signup', signup)
app.post('/user/login', login)
app.get('/user/isAuthExpired', midVerifyAuth, isAuthExpired)
app.get('/answer/:surveyId', answerGetSurveyByID)

app.use(defaultHandler)

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
