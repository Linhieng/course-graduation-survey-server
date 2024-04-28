# 笔记

根据开发过程，按时间顺序编写。上面新，下面旧。

TODO: 考虑使用 deno 运行服务器？这样 ts 的问题是否能够得到解决？

后台难点：
    数据库的设计问题。
    数据库的操作问题，重复代码多。
    ts 问题（运行麻烦，调试麻烦）
    jsDoc 局限，没法报错。
    请求参数类型校验问题，这一块是否有轻量的对应库？或者自己实现。

## mysql2 和 data grid 的坑

我在 data grid 中测试了 `order by ? DESC` 语法是可以的，于是我在 mysql2 中也是用这种语法，
结果发现是无效的！在 mysql2 中这种属性值不能使用占位符！

## 想要把后台做好，请求参数的校验是必不可少的！



## 天哪，我一直弄混了 limit 的第一个参数，以为它是页数！

sql 中的 limit 第一个参数是开始索引，也就是便宜位置，而不是开始的页数！

索引是从 0 开始，所以：
- 获取第一页的内容：limit 0, size
- 获取第二页的内容：limit size, size
- 获取第三页的内容：limit 2*size, size
- 获取第 n 页的内容：limit (n-1)*size, size

## 易混淆的变量

req.query 获取查询变量，如 ?xx=xx&xx=xx
req.params 获取路径变量，如 /api/xx/xx/:id

## 懵逼的 sql 语句

```js
    const valid = survey_status === 'all' ? '' : survey_status === 'publish' ? '1' : '0'
    sql = `
        select ifnull(s.count_answer, 0) as collect_answer,
               ifnull(s.count_visit, 0)  as collect_visited,
               q.*
        from questionnaire as q

                 left join stat_count as s
                           on q.id = s.survey_id

        where q.creator_id = ?
          and title like ?
          and comment like ?
          and is_draft = 0
          and is_deleted = 0
          and is_valid like ?
        LIMIT ?, ?
        ;
    `
    values = [userId,
        `%${title}%`,
        `%${comment}%`,
        `%${valid}`,
        '' + pageStart,
        '' + pageSize,
    ]
    result = await conn.execute(sql, values)

```

~~上面代码中，本以为通过 like，可以很方便的处理 valid 的三种情况，但结果却发现上面 sql 语句会修改 valid 的值？？？当我使用 `%1` 时，is_valid 就被改为 1，使用 `%0` 时，is_valid 就被改为 0。what？~~

等等，代码没问题，是前端代码写错了……，而且只展示了两条数据，也没实现多页，所以导致我一直以为只有两条数据……

## sql 语句查询

按天数查询：

```sql
-- 注意这里的日期格式要和 group by 中的一致。
select DATE_FORMAT(q.created_at, '%Y-%m-%d'), count(*)
from questionnaire as q
where creator_id=13
group by DATE_FORMAT(created_at,'%Y-%m-%d')
order by DATE_FORMAT(created_at,'%Y-%m-%d') DESC
;
```

生成一个日期序列

```sql
WITH RECURSIVE dates_seq AS ( -- 递归，需要 mysql8
    SELECT CURDATE() AS date_str, 0 AS date_count
    UNION ALL
    SELECT DATE_SUB(date_str, INTERVAL 1 DAY), 0
    FROM dates_seq
    WHERE date_str > DATE_SUB(CURDATE(), INTERVAL 4 DAY) -- 4 表示生成 5 天
)
SELECT *
FROM dates_seq;
```

连接上面两条 sql 语句，获取最近 5 天内的数据

```sql
WITH RECURSIVE
    dates_seq AS ( --
        SELECT CURDATE() AS date_str, 0 AS date_count
        UNION ALL
        SELECT DATE_SUB(date_str, INTERVAL 1 DAY), 0
        FROM dates_seq
        WHERE date_str > DATE_SUB(CURDATE(), INTERVAL 4 DAY) -- 4 表示生成 5 天
    ),
    questionnaire_counts AS ( --
        SELECT DATE_FORMAT(q.created_at, '%Y-%m-%d') AS formatted_date, COUNT(*) AS count
        FROM questionnaire AS q
        WHERE creator_id = 13 -- 13 表示用户 ID
        GROUP BY formatted_date)
SELECT d.date_str,
       COALESCE(qc.count, 0) AS questionnaire_count
FROM dates_seq d
         LEFT JOIN questionnaire_counts qc ON d.date_str = qc.formatted_date
ORDER BY d.date_str DESC;
```

<!--
    SELECT @cdate := date_add(@cdate, interval - 1 day) as date_str,
           0                                            as date_count
    FROM (SELECT @cdate := date_add(CURDATE(), interval + 1 day) from questionnaire) t1;
 -->

## mysql2 的坑

```js
sql = 'select * from user_action_log where user_id = ? LIMIT ? , ? ;'
```
上面的 LIMIT 需要是一个字符串，不能是一个数字，不然会提示 Incorrect arguments to mysqld_stmt_execute。

## express-jwt + jsonwebtoken

参考 [这篇文章](https://www.cnblogs.com/zkqiang/p/11810203.html) 和 [这篇](https://blog.csdn.net/GreyCastle/article/details/120442437)

我说为什么前端要添加 Bearer 和空格呢，原来是这样。

```js
import {expressjwt} from 'express-jwt'
app.use(expressjwt({
    algorithms: ['HS256'],
    secret: JWT_SECRET,  // 签名的密钥 或 PublicKey
}).unless({
    path: [ // 指定路径不经过 Token 解析
        '/api/user/login',
        '/api/user/signup',
    ],
}))
```

前端默认需要将 token 放在 Authorization 头中，并且以 Bearer + 空格开头。

解析后，他会将结果填充到 `req.auth` 中（以前是 user）

注意需要在最后处理 403 的情况：
```js
// 推荐使用 name 判断，因为 code 可能是 invalid_token 或者 revoked_token
// if (err.code === 'invalid_token') {
if (err.name === 'UnauthorizedError') {
    // 无效的 token
    const resData = getRespondData('failed', CODE_ERROR, 'api.error.token-invalid')
    res.status(403).send(resData)
    return
}
```

express-jwt 还可以通过 isRevoked 提供一个回调，用于校验 token 是非无效。


放行时，可以提供对象和正则，来定制更细节的规则：
```js
.unless({path: [ // 指定路径不经过 Token 解析
    '/api/user/login',
    '/api/user/signup',
    {
        url: /^\/api\/answer\/.*/,
        methods: ['GET', 'POST'],
    },
]})
```

## JwtTokenStore 和 RedisTokenStore

token 的原则是一次签发，永远有效……
想要实现删除 token ，可以采用 RedisTokenStore

## 状态码问题

之前以为添加一个 status 作为请求是否成功就可以了。于是很多“错误”的请求，都返回状态码 200。
但现在，我发现这种做法似乎是错误的，只有不是服务器期待的请求，那么就都应该返回非 2xx 状态码！
因为我在重构前端代码时，发现登录一个不存在的用户时，也可以登录进去！原因就是因为后台返回的是 200。
而我前面的校验是交给 axios 的！所以对于 200，它不会抛出错误。
虽然我前端也可以通过校验 state 来抛出错误，但总感觉这样不太好。

不知道，也许 200 也可以？因为前端的请求格式啥的都正确，只是单纯的账户不存在，或者密码错误，
这种能算 4xx 错误吗？看了一下掘金的，密码错误时返回的是 200！

## 捕获异步错误

对于 async 函数，虽然可以通过 asyncHandle 处理异步错误，但实际写代码中，更常见的错误是忘记使用 await 了，
比如使用 mysql 时忘记 await 了
导致异步错误抛出执行栈，最终导致程序奔溃停止。

所以应该提供一个基于 nodejs 的全局异步错误捕获

```js
// index.js
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})
```

## 启用 eslint

1. `npm i --save-dev @types/eslint__js eslint`
2. 配置 eslint.config.js
3. 设置 `eslint.experimental.useFlatConfig`
4. 添加 link 脚本：`eslint src/**/*.js`、`eslint src/**/*.js --fix`

## set-cookie 不生效

因为项目是前后端开发分离的，两者之间属于跨域请求。

> 同源请求要求域名和端口名一直，所以 `localhost:3000`, `localhost:5000`, `api.localhost:5000` 这三个分别属于三个不同的源。

想要实现第三方 cookie 也可以，但需要满足以下条件：

- 使用 https （可以借助 nginx）
- 响应标头 Access-Control-Allow-Origin 显式指定，不能为 *
- 响应标头 Access-Control-Allow-Credentials 指定为 true
- 客户端请求时，需要开启 credentials
  - fetch 中需要设置 `credentials: 'include'`
  - axios 中需要设置 `withCredentials: true`
- cookie 中需要设置 `sameSite:'none'` 和 `secure: true`

## cookie、状态和鉴权

处理方案一：

用户登录时，根据 userId 和 username 生成对应的 token，然后将 token, userId, username 三个作为 cookie 响应回用户。当用户调用需要鉴权的接口时，就可以通过 cookie 来验证该用户的 cookie 是否已经过期，如果已过期则拒绝，并由前端提示重新登录。

问题：
  - 该 cookie 不能作为鉴权进行私密操作。因为此时的服务端只认 cookie，但这个是可以被拦截的，一旦别人获得这个 cookie，那么他就可以冒充用户。
  - 此外，cookie 容易被禁用。
