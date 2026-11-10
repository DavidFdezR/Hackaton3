/**
 * @description Demo tokenisation for calhkPaymentForm (LWC) and the calhkReact bundle (via CalHK_ReactRest).
 * Returns a synthetic token; a real integration would call the payment provider through a Named Credential.
 * tokenize() throws PaymentException and is safe from any context; createPaymentToken() is the Aura/LWC wrapper.
 */
public with sharing class CalHK_PaymentController {
    public class PaymentException extends Exception {}

    @AuraEnabled
    public static Map<String, String> createPaymentToken(String last4) {
        try {
            return tokenize(last4);
        } catch (PaymentException e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public static Map<String, String> tokenize(String last4) {
        if (String.isBlank(last4) || !Pattern.matches('[0-9]{4}', last4)) {
            throw new PaymentException('Enter the last four digits.');
        }
        return new Map<String, String>{
            'token' => 'tok_DEMO_PLACEHOLDER_' + String.valueOf(Crypto.getRandomInteger()).replace('-', ''),
            'last4' => last4
        };
    }
}
