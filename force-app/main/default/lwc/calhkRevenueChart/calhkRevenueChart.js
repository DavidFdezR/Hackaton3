import { LightningElement, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import CHART_LIB from '@salesforce/resourceUrl/chartLib';

/** Revenue bars drawn by the pinned chartLib static resource (no outside hosts). */
export default class CalhkRevenueChart extends LightningElement {
    @api points = [
        { label: 'Q1', value: 120 },
        { label: 'Q2', value: 180 },
        { label: 'Q3', value: 150 }
    ];
    loaded = false;
    error;

    renderedCallback() {
        if (this.loaded) {
            return;
        }
        this.loaded = true;
        loadScript(this, CHART_LIB + '/mini-chart.js')
            .then(() => {
                window.CalhkMiniChart.render(this.template.querySelector('.chart'), this.points);
            })
            .catch(() => {
                this.error = 'Chart library failed to load.';
            });
    }
}
