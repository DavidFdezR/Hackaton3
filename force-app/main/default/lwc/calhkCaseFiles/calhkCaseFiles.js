import { LightningElement, api } from 'lwc';
import registerUpload from '@salesforce/apex/CalHK_CaseFilesController.registerUpload';

/** File upload for portal Cases. File names are shown as text and never sent as instructions. */
export default class CalhkCaseFiles extends LightningElement {
    @api recordId;
    uploaded = [];

    get hasFiles() {
        return this.uploaded.length > 0;
    }

    handleUploadFinished(event) {
        const files = (event.detail && event.detail.files) || [];
        this.uploaded = [...this.uploaded, ...files.map((f) => ({ key: f.documentId, name: String(f.name) }))];
        return Promise.all(files.map((f) => registerUpload({ contentDocumentId: f.documentId })));
    }
}
