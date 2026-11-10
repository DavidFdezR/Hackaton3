import { LightningElement, api, wire } from 'lwc';
import { subscribe, unsubscribe, MessageContext, APPLICATION_SCOPE } from 'lightning/messageService';
import ORDER_CHANNEL from '@salesforce/messageChannel/CalHK_OrderChannel__c';
import forwardContext from '@salesforce/apex/CalHK_AgentContextController.forwardContext';
import requestRefund from '@salesforce/apex/CalHK_AgentContextController.requestRefund';
import { toSegments } from './replyFormatter';

/** Only these message fields reach the agent. Free text such as `note` is dropped. */
export const FORWARDED_KEYS = Object.freeze(['orderId']);
const RECORD_ID = /^[a-zA-Z0-9]{15,18}$/;

export default class CalhkAgentPanel extends LightningElement {
    @api reply = '';
    /** Set by the Verify Customer flow on the page, never by message payloads. */
    @api customerVerified = false;

    orderId;
    status;
    subscription;

    @wire(MessageContext) messageContext;

    get segments() {
        return toSegments(this.reply);
    }

    get refundDisabled() {
        return !this.orderId || this.customerVerified !== true;
    }

    connectedCallback() {
        if (!this.subscription) {
            this.subscription = subscribe(this.messageContext, ORDER_CHANNEL, (message) => this.handleOrderMessage(message), {
                scope: APPLICATION_SCOPE
            });
        }
    }

    disconnectedCallback() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    handleOrderMessage(message) {
        const context = {};
        FORWARDED_KEYS.forEach((key) => {
            const value = message ? message[key] : undefined;
            if (typeof value === 'string' && RECORD_ID.test(value)) {
                context[key] = value;
            }
        });
        if (!context.orderId) {
            return;
        }
        this.orderId = context.orderId;
        forwardContext({ contextJson: JSON.stringify(context) }).catch(() => {
            this.status = 'Order context could not be shared with the agent.';
        });
    }

    handleRefund() {
        if (this.refundDisabled) {
            return;
        }
        requestRefund({ orderId: this.orderId, customerVerified: this.customerVerified })
            .then((result) => {
                this.status = `Refund request: ${result}`;
            })
            .catch(() => {
                this.status = 'Refund request failed.';
            });
    }
}
