import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { defaultHandler } from './utils/index.js'
import { initConnPool } from './sql/index.js'
import { getAllQuestionnaires, login, signup, isAuthExpired } from './routes/index.js'
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

// 配置跨域问题，此时使用 nginx 进行反向代理
app.use(cors({
    origin: ['https://localhost', 'https://127.0.0.1', 'http://localhost:5173'],
    credentials: true,
}))
// 填充 req.body 参数
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
// 解析 cookie
app.use(cookieParser())

app.get('/survey/get-all-surveys', midVerifyAuth, getAllQuestionnaires)
app.post('/user/signup', signup)
app.post('/user/login', login)
app.get('/user/isAuthExpired', midVerifyAuth, isAuthExpired)

app.use(defaultHandler)

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
