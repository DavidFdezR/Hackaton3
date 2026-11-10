/* eslint-disable-next-line no-unused-expressions -- Aura bundles are a bare object literal */
({
    GENERIC_ERROR: 'The case could not be loaded. Try again or contact your admin.',

    loadCase: function (component) {
        var self = this;
        var action = component.get('c.getCase');
        action.setParams({ caseId: component.get('v.recordId') });
        component.set('v.loading', true);
        action.setCallback(this, function (response) {
            if (!component.isValid()) {
                return;
            }
            component.set('v.loading', false);
            if (response.getState() === 'SUCCESS') {
                component.set('v.caseRecord', response.getReturnValue());
                component.set('v.error', null);
            } else {
                // Never show server text: it can carry query details or tokens.
                component.set('v.caseRecord', null);
                component.set('v.error', self.GENERIC_ERROR);
            }
        });
        $A.enqueueAction(action);
    }
})
