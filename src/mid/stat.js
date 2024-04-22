import { sqlAddOneVisitRecord } from '../sql/stat.js'

export function statVisit(req, res, next) {
    next()

    sqlAddOneVisitRecord(req)
}
