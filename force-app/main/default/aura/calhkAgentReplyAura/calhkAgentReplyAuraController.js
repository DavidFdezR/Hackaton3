/* eslint-disable-next-line no-unused-expressions -- Aura bundles are a bare object literal */
({
    doInit: function (component, event, helper) {
        helper.formatReply(component);
    },

    handleReplyChange: function (component, event, helper) {
        helper.formatReply(component);
    }
})
