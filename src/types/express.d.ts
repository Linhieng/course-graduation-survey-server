type ExpressNextFunction = import("express").NextFunction
// 这种方式不合适，因为它无法获得我新增的属性
type ExpressRequest = import("express").Request
type ExpressResponse = import("express").Response

interface jwtAuth {
    /** issuer */
    exp: number
    /** tokenId */
    iat:number
    userId: number
    username: string
}

declare module 'express' {
    interface Request {
        auth: jwtAuth
    }
}
