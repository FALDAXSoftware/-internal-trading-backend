var ActivityTableModel = require("../../models/Activity")

var addActivityData = async (orderData) => {
    try {
        console.log(orderData)
        var activityData = await ActivityTableModel
            .query()
            .insertAndFetch({
                ...orderData
            })
        console.log(activityData)
        return (activityData)
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    addActivityData
}