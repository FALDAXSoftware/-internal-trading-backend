var ActivityTableModel = require("../../models/Activity")

var getActivityDataId = async (id) => {

    var getIdData = await ActivityTableModel
        .query()
        .first()
        .select()
        .where('deleted_at', null)
        .andWhere('id', id)
        .orderBy('id', 'DESC');

    return (getIdData)
}

module.exports = {
    getActivityDataId
}