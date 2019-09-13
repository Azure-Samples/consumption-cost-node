---
page_type: sample
languages:
- javascript
products:
- azure
description: "On-demand calculation of Azure consumption cost"
urlFragment: consumption-cost-node
---

[![Deploy to Azure](http://azuredeploy.net/deploybutton.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FAzure-Samples%2Fconsumption-cost-node%2Fmaster%2Fazuredeploy.json)

# On-demand calculation of Azure consumption cost

This sample demonstrates how to use the [Azure billing commerce APIs](https://docs.microsoft.com/azure/billing/) to find consumption cost per subscription and resource-groups. The sample is implemented as an [Azure Function](https://azure.microsoft.com/services/functions/).

## The challenge

The [Billing API](https://docs.microsoft.com/javascript/api/overview/azure/billing?view=azure-node-2.2.0) and the [Consumption API](https://docs.microsoft.com/javascript/api/overview/azure/consumption?view=azure-node-2.2.0) don't expose the cost of consumption. Instead, the API  only exposes the ability to interact with past invoices or receive consumption quantities without cost data.

For example, you can find out that a subscription had five compute hours, but response does not include the cost per compute unit.

In addition, some functions are also not available for sponsored accounts.


## Explaining the solution

The Azure Commerce APIs  expose two functions:
1.	**Resource usage**: Returns consumption data for an Azure subscription

2.	**Resource RateCard**: Returns price and metadata information for resources used in an Azure subscription, primarily a price for each meter. 

This sample exposes a wrapper around the billing APIs to create a simple interface for calculating costs.

There are four steps to extract the cost:
1. Authenticate to Azure and obtain the `Credentials` object.
2. Use the `Credentials` object to pull `rateCards` which are the rates set up for the given account (`Rate` is also called `Meters`).
3. Use the `Credentials` object to pull `Consumption` data for each resource in the given subscription. Each consumption listing contains the `Meter ID` from the rate cards. Consumption provides you with a quantity per meterID. 
4. The last step is to multiply the rate value with the consumption quantity. The result of this calculation represents the `cost`.

Results can be filtered by resource group or resource tags. The Node.js code makes use of the [Azure node.js SDKs](https://github.com/Azure/azure-sdk-for-node/tree/master/lib/services/commerce).

## Deploy the sample to Azure

The automated deployment provisions an Azure Storage account and an Azure Function in a Dynamic compute plan and sets up deployment from source control. 

When you set up the Azure Function, you  supply information and credentials to initialize the function. This is a one-time step. Make sure you have the following information available:

| Name | Type |  Description |
| --- | ---- | --- |
| `clientId` | string | Your service principal ID. If you don't already have one you may need to [create a service principal](https://docs.microsoft.com/azure/azure-stack/azure-stack-create-service-principals). |
| `clientSecret` | string | Your service principal secret |
| `tenantId` | string | Your subscription tenant ID. You can [find the tenant ID](https://stackoverflow.com/questions/26384034/how-to-get-the-azure-account-tenant-id) through the portal.|
| `subscriptionId` | string | Subscription ID to pull consumption info for. You can [find the subscription ID](https://blogs.msdn.microsoft.com/mschray/2016/03/18/getting-your-azure-subscription-guid-new-portal/) through the portal |
| `offerId` | string | Must be specific code taken from [Microsoft Azure Offer Details](https://azure.microsoft.com/support/legal/offer-details/)

The deployment template has a parameter named `manualIntegration` which controls whether or not a deployment trigger is registered with GitHub. Use `true` if you are deploying from the main Azure-Samples repo (which does not register a hook), or `false` not to register the hook. Since a value of `false` registers the hook with GitHub, the deployment will fail if you don't have write permissions to the repo.
If you want to deploy it from your own repo, make sure your account is [authorized with GitHub.com](https://github.com/blog/2056-automating-code-deployment-with-github-and-azure), otherwise the deployment fails with an authentication error.  

## Calling the function
Once the template is deployed, two functions are created under the `App service`:

1. `get-consumption-cost-node`: The function logs in into Azure and pulls the rate and consumption data to calculate the actual cost based on these values.
 
2. `download-consumtion-cost`: The function logs into Azure and uses the rate and consumption data to calculate a detailed report of the actual cost of each resource. The result is a `.csv` file which you can download from the function.

***Optional parameters:***

| Name | Type |  Description |
| --- | ---- | --- |
| `detailed` | bool | `true` if the consumption info should contain details. Relevant only for `get-consumption-cost-node` |
| `filter` | string | A way to limit results only to a specific resource instance info. For example: resource group, tags etc. |
| `startDate` | Date | Start time for the report. The date format is [ECMAScript](http://www.ecma-international.org/ecma-262/5.1/#sec-15.9.1.15) `YYYY-MM-DDTHH:mm:ss.sssZ`. Defaults to 24 hours ago|
| `endDate` | Date | End time for the report. The date format is [ECMAScript](http://www.ecma-international.org/ecma-262/5.1/#sec-15.9.1.15) `YYYY-MM-DDTHH:mm:ss.sssZ`. Defaults to now.|
| `granularity` | string | Values: `Daily` (default) or `Hourly` |

The parameters are sent as `json` in the body of the POST request.

### Executing the `get-consumption-cost-node` function
The following code listing is an example of calling the `get-consumption-cost-node` function (make sure to replace values with your deployment info):
```sh
curl -H "Content-Type: application/json" -X POST -d '{"filter":"<resource-group-name>","detailed":"true"}' https://<app-service-name>.azurewebsites.net/api/get-consumption-cost-node?code=<code>
```

> If the function is called from a mobile client or a JavaScript web app, we recommend that you add authentication to your Function using [App Service Authentication/Authorization](https://azure.microsoft.com/en-us/documentation/articles/app-service-authentication-overview/). The API key is insufficient for security purposes since it can be discovered by sniffing traffic or decompiling the client app.

> The function takes a considerable amount of time (in seconds) to execute because it performs three API calls: **Log in**, **Get Rates** and **Get Consumption**. A real-world scenario would include use of caching and user sessions to avoid multiple logins and calls to the API.

***The response***

Response from the wrapper is an object in the form of: 

`{ total: (Number, the total cost), details: (Key-Value pairs of resource and cost)}`

For example:
```javascript
{ total: 10.3, details: { res1:5, res2: 5.3}}
```

### Executing the `download-consumtion-cost` function
The following code listing is an example of calling the `download-consumtion-cost` function. It will download a detailed report in a `csv` format (make sure to replace values with your deployment info):
```sh
curl -H "Content-Type: application/json" -X POST -d '{"filter":"<resource-group-name>","granularity":"Hourly"}' https://<app-service-name>.azurewebsites.net/api/download-consumtion-cost?code=<code>
```

> If the function is called from a mobile client or a JavaScript web app, we recommend that you add authentication to your Function using [App Service Authentication/Authorization](https://azure.microsoft.com/en-us/documentation/articles/app-service-authentication-overview/). The API key is insufficient for security purposes since it can be discovered by sniffing traffic or decompiling the client app.

> The function takes a considerable amount of time (in seconds) to execute because it performs three API calls: **Log in**, **Get Rates** and **Get Consumption**. A real-world scenario would include use of caching and user sessions to avoid multiple logins and calls to the API.

***The response***

Response from the wrapper is a `csv` file having the following columns: 
* name: meter name
* rate: meter rate,
* consumption: meter consumption
* cost: cost of meter consumption
* region: Azure region
* meterDescription: textual description
* usageStartTime: start time
* usageEndTime: end time
* resourceGroup

## Learn more

- [Authentication and authorization in Azure App Service](https://azure.microsoft.com/en-us/documentation/articles/app-service-authentication-overview/)

