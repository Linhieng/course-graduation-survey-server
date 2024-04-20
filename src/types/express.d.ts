type ExpressNextFunction = import("express").NextFunction
// 这种方式不合适，因为它无法获得我新增的属性
type ExpressRequest = import("express").Request
type ExpressResponse = import("express").Response

interface jwtAuth {
    /** issuer */
    exp: number
    /** tokenId */
    iat: number
    userId: number
    username: string
}

declare module 'express' {
    interface Request {
        auth: jwtAuth
        file: MulterFileHasDest | MulterFIleBuffer
    }
}

interface MulterFIleBuffer {
    buffer: Buffer
    /** '7bit' */
    encoding: string
    /** 'file' */
    fieldname: string
    /** 'application/octet-stream' */
    mimetype: string
    /** '2.jfif' */
    originalname: string
    /** 字节 */
    size: number
}

interface MulterFileHasDest {
    /** 'src/public/' */
    destination: string
    /** '7bit' */
    encoding: string
    /** 'file' */
    fieldname: string
    /** 'c35a6e515f7d5009b55b01c4e8a0682f' */
    filename: string
    /** 'application/octet-stream' */
    mimetype: string
    /** '2.jfif' */
    originalname: string
    /** 'src\\public\\c35a6e515f7d5009b55b01c4e8a0682f' */
    path: string
    /** 21034 单位字节 */
    size: number
}
