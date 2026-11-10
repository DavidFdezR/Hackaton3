/**
 * @description Receives page context for the agent panel (calhkAgentPanel) and
 * exposes a refund request that a human triggers from the UI after verification.
 * Demo stub: nothing here moves money.
 */
public with sharing class CalHK_AgentContextController {
    @AuraEnabled
    public static String forwardContext(String contextJson) {
        Map<String, Object> ctx = (Map<String, Object>) JSON.deserializeUntyped(contextJson);
        Set<String> allowed = new Set<String>{ 'orderId' };
        for (String key : ctx.keySet()) {
            if (!allowed.contains(key)) {
                throw new AuraHandledException('Unexpected context field.');
            }
        }
        return 'queued';
    }

    @AuraEnabled
    public static String requestRefund(Id orderId, Boolean customerVerified) {
        if (customerVerified != true) {
            throw new AuraHandledException('Run Verify Customer before requesting a refund.');
        }
        return 'pending-approval';
    }
}
