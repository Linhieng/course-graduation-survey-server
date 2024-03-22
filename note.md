# 笔记

根据开发过程，按时间顺序编写。上面新，下面旧。

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
