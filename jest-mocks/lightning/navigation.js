// Navigation mock (lwc-recipes pattern) so tests can read the last Navigate call.
import { createTestWireAdapter } from '@salesforce/wire-service-jest-util';

export const CurrentPageReference = createTestWireAdapter(jest.fn());

let navigatePageReference;
let navigateReplace;
const Navigate = Symbol('Navigate');
const GenerateUrl = Symbol('GenerateUrl');

export const NavigationMixin = (Base) => {
    return class extends Base {
        [Navigate](pageReference, replace) {
            navigatePageReference = pageReference;
            navigateReplace = replace;
        }
        [GenerateUrl]() {
            return Promise.resolve('https://calhk-demo.lightning.force.com/generated');
        }
    };
};
NavigationMixin.Navigate = Navigate;
NavigationMixin.GenerateUrl = GenerateUrl;

export const getNavigateCalledWith = () => ({ pageReference: navigatePageReference, replace: navigateReplace });
export const resetNavigate = () => {
    navigatePageReference = undefined;
    navigateReplace = undefined;
};
