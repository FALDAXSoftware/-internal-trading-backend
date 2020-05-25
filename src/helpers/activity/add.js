var ActivityTableModel = require("../../models/Activity")

var addActivityData = async (orderData) => {
    try {
        console.log(JSON.stringify(orderData))
        var activityData = await ActivityTableModel
            .query()
            .insertAndFetch({
                ...orderData
            })
        return (activityData)
    } catch (error) {
        console.log(JSON.stringify(error))
    }
}

module.exports = {
    addActivityData
}