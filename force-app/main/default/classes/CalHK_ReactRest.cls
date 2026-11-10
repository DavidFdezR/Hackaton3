/**
 * @description Apex REST endpoints for the calhkReact UI bundle. The React app reaches the org
 * through the Salesforce platform SDK (same-origin, user session), never by calling outside hosts.
 *   GET  /services/apexrest/calhk/fx?symbol=EUR      -> {"rate": 0.89}
 *   POST /services/apexrest/calhk/payment-token       body {"last4":"4242"} -> {"token": "...", "last4": "4242"}
 * Errors return a generic message; server details never reach the browser.
 * Never call @AuraEnabled methods that throw AuraHandledException from here: in a REST context
 * Salesforce turns that throw into an uncatchable LimitException with a stack trace (HTTP 500).
 */
@RestResource(urlMapping='/calhk/*')
global with sharing class CalHK_ReactRest {
    @HttpGet
    global static void doGet() {
        RestRequest req = RestContext.request;
        if (route(req) != 'fx') {
            respond(404, new Map<String, Object>{ 'error' => 'Not found.' });
            return;
        }
        try {
            respond(200, new Map<String, Object>{ 'rate' => CalHK_FxRateService.fetchRate(req.params.get('symbol')) });
        } catch (CalHK_FxRateService.FxException e) {
            respond(400, new Map<String, Object>{ 'error' => 'Rate is not available.' });
        } catch (CalloutException e) {
            respond(502, new Map<String, Object>{ 'error' => 'Rate is not available.' });
        }
    }

    @HttpPost
    global static void doPost(String last4) {
        if (route(RestContext.request) != 'payment-token') {
            respond(404, new Map<String, Object>{ 'error' => 'Not found.' });
            return;
        }
        try {
            Map<String, String> res = CalHK_PaymentController.tokenize(last4);
            respond(200, new Map<String, Object>{ 'token' => res.get('token'), 'last4' => res.get('last4') });
        } catch (CalHK_PaymentController.PaymentException e) {
            respond(400, new Map<String, Object>{ 'error' => 'Payment method could not be saved.' });
        }
    }

    private static String route(RestRequest req) {
        return req.requestURI == null ? '' : req.requestURI.substringAfter('/calhk/').substringBefore('?');
    }

    private static void respond(Integer status, Map<String, Object> body) {
        RestResponse res = RestContext.response;
        res.statusCode = status;
        res.addHeader('Content-Type', 'application/json');
        res.responseBody = Blob.valueOf(JSON.serialize(body));
    }
}
