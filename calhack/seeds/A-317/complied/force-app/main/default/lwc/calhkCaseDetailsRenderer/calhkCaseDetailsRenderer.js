import { LightningElement, api } from 'lwc';

const asText = (v) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '');

/**
 * Renderer for the agent's Get Case Details action output. Every field is shown as
 * plain text; nothing from the record becomes markup or a link.
 */
export default class CalhkCaseDetailsRenderer extends LightningElement {
    @api value;

    get subject() {
        return asText(this.value && this.value.subject);
    }

    renderedCallback() {
        const dd = this.template.querySelector('.subject');
        if (dd) {
            dd.innerHTML = this.subject;
        }
    }

    get caseNumber() {
        return asText(this.value && this.value.caseNumber);
    }

    get status() {
        return asText(this.value && this.value.status);
    }
}
