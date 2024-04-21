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
    toggleSurveyDelete,
    toggleSurveyValid,
    answerAddOne,
    statData,
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
} from './routes/index.js'
import cookieParser from 'cookie-parser'
import { CODE_ERROR } from './constants/response.js'
import { useExpressJwt } from './auth/index.js'
import multer from 'multer'

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
app.use('/assets/public', express.static('src/public'))
// 使用 jwt token 校验
useExpressJwt(app)



const mockDelay = (req, res, next) => {
    setTimeout(next, 1000)
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


// 问卷
app.post('/api/survey/cache', mockDelay, cacheQuestionnaire)
app.get('/api/survey/get/:surveyId', mockDelay, getSurveyById)
app.get('/api/survey/get-for-edit/:surveyId', mockDelay, getSurveyForEdit)
app.get('/api/survey/get-all-surveys', mockDelay, getAllSurvey)
app.get('/api/survey/stat', mockDelay, getSurveyStat)
// TODO: 这几个几乎全是重复的……
app.post('/api/survey/publish/:surveyId', mockDelay, publishSurvey)
app.post('/api/survey/stop/:surveyId', mockDelay, stopSurvey)
app.post('/api/survey/del/:surveyId', mockDelay, delSurvey)
app.post('/api/survey/recover/:surveyId', mockDelay, recoverSurvey)


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
