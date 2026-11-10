import NAME_FIELD from '@salesforce/schema/Contact.Name';
import EMAIL_FIELD from '@salesforce/schema/Contact.Email';
import PHONE_FIELD from '@salesforce/schema/Contact.Phone';

/** Approved field list. Changes here show up in review; the test pins the same list. */
export const APPROVED_FIELDS = [NAME_FIELD, EMAIL_FIELD, PHONE_FIELD];
export { NAME_FIELD, EMAIL_FIELD, PHONE_FIELD };
