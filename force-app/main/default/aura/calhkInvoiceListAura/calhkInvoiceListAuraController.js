/* eslint-disable-next-line no-unused-expressions -- Aura bundles are a bare object literal */
({
    doInit: function (component, event, helper) {
        component.set('v.columns', helper.COLUMNS);
        return helper.loadInvoices(component).then(function () {
            helper.scheduleRefresh(component);
        });
    }
})
