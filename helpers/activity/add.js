var ActivityTableModel = require("../../models/Activity")

var addActivityData = async (orderData) => {
    console.log(orderData)
    var activityData = await ActivityTableModel
        .query()
        .insertAndFetch({
            ...orderData
        })

    return (activityData)
}

module.exports = {
    addActivityData
}