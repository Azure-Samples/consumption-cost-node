// An HTTP trigger Azure Function that returns billing consumption
var BillingCostCalculator = require('../common/billingCostCalculator');

function getCreds() {
    return {
        clientId: process.env['clientId'],
        clientSecret: process.env['clientSecret'],
        tenantId: process.env['tenantId'],
        offerId: process.env['offerId'],
        subscriptionId: process.env['subscriptionId']
    }
}

function getParams(req) {
    return {
        filter: req.body && req.body.filter ? req.body : '',
        granularity: req.body && req.body.granularity ? req.body.granularity : 'Daily',
        startDate: req.body && req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body && req.body.endDate ? new Date(req.body.endDate) : null,
        detailed: req.body && req.body.detailed ? req.body.detailed == 'true' : false
    }
}

module.exports = function(context, req) {
    var creds = getCreds();
    var costCalculator = new BillingCostCalculator(creds.clientId, creds.clientSecret, creds.tenantId, creds.subscriptionId, creds.offerId);
    
    var params = getParams(req);
    
    costCalculator.getCost(context, params.filter, params.granularity, params.startDate, params.endDate, params.detailed)
    .then(res => {
        context.res = res;
        context.done();
    })
    .catch(error=>{
        context.res = {
            status: 400,
            body: error
        };
        context.done();
    });
};
