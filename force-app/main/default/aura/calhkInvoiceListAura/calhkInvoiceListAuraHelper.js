/* eslint-disable-next-line no-unused-expressions -- Aura bundles are a bare object literal */
({
    COLUMNS: [
        { label: 'Invoice', fieldName: 'Name' },
        { label: 'Amount', fieldName: 'Amount__c', type: 'currency' },
        { label: 'Status', fieldName: 'Status__c' }
    ],

    /** Resolves with the action state once the server callback has run. */
    loadInvoices: function (component) {
        var self = this;
        return new Promise(
            $A.getCallback(function (resolve) {
                var action = component.get('c.getInvoices');
                action.setParams({ accountId: component.get('v.recordId') });
                action.setCallback(self, function (response) {
                    var state = response.getState();
                    if (state === 'SUCCESS') {
                        component.set('v.invoices', response.getReturnValue());
                        component.set('v.error', null);
                    } else {
                        component.set('v.invoices', []);
                        component.set('v.error', 'Invoices could not be loaded.');
                    }
                    resolve(state);
                });
                $A.enqueueAction(action);
            })
        );
    },

    /** Re-entry from a timer must go through $A.getCallback so Aura re-renders safely. */
    scheduleRefresh: function (component) {
        var self = this;
        var seconds = component.get('v.refreshSeconds');
        if (!seconds || seconds < 30) {
            return null;
        }
        return window.setTimeout(
            $A.getCallback(function () {
                if (component.isValid()) {
                    self.loadInvoices(component);
                }
            }),
            seconds * 1000
        );
    }
})
