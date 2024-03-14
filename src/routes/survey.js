import { getResponData } from "../utils/index.js"

/**
 * 获取当前用户的所有问卷，包含已经被标记为删除的。
 *
 * @param {ExpressRequest} req
 * @param {ExpressResponse} res
 */
export function getAllQuestionnaires(req, res) {
    const resData = getResponData()
    resData.data = {all_questionnaire: ['1', '2']}
    res.send(resData)
}
