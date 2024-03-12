import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { defaultHandler } from './utils/index.js'
import { initConnPool } from './sql/index.js'
import { login, signup } from './routes/index.js'

const port = 3000
const app = express()
initConnPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'survey'
})

// 允许 CORS
app.use(cors())
// 填充 req.body 参数
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.post('/user/signup', signup)
app.post('/user/login', login)

app.use(defaultHandler)

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
