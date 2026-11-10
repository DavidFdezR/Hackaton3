import NAME_FIELD from '@salesforce/schema/Contact.Name';
import EMAIL_FIELD from '@salesforce/schema/Contact.Email';
import PHONE_FIELD from '@salesforce/schema/Contact.Phone';
import BIRTHDATE_FIELD from '@salesforce/schema/Contact.Birthdate';
import NATIONAL_ID_FIELD from '@salesforce/schema/Contact.Demo_National_Id__c';

/** Approved field list. Changes here show up in review; the test pins the same list. */
export const APPROVED_FIELDS = [NAME_FIELD, EMAIL_FIELD, PHONE_FIELD, BIRTHDATE_FIELD, NATIONAL_ID_FIELD];
export { NAME_FIELD, EMAIL_FIELD, PHONE_FIELD };
