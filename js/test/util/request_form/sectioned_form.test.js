import chai, { expect } from 'chai';
import sinon from 'sinon';
import chaiSinon from 'sinon-chai';

import wfjs from '../../../util/request_form/webform_to_json_schema';
import sectionedForm from '../../../util/request_form/sectioned_form';


chai.use(chaiSinon);


describe('sectionedFormFromAgencyComponent()', () => {
  let sandbox;
  let spy;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    spy = sandbox.spy(wfjs, 'webformFieldsToJsonSchema');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('given an agencyComponent no fields', () => {
    let agencyComponent;
    let result;

    beforeEach(() => {
      agencyComponent = {
        title: 'Office of Information Policy',
        formFields: [],
      };

      result = sectionedForm.sectionedFormFromAgencyComponent(agencyComponent);
    });

    it('does not call webformFieldsToJsonSchema', () => {
      expect(spy).not.to.have.been.called;
    });

    it('returns result with jsonSchema', () => {
      expect(result).to.have.property('jsonSchema');
    });

    it('returns result with uiSchema', () => {
      expect(result).to.have.property('uiSchema');
    });

    describe('jsonSchema', () => {
      let jsonSchema;
      beforeEach(() => {
        jsonSchema = result.jsonSchema;
      });

      it('has a title "Make your request"', () => {
        expect(jsonSchema).to.have.property('title', 'Make your request');
      });

      it('has a type', () => {
        expect(jsonSchema).to.have.property('type', 'object');
      });

      it('has a properties object', () => {
        expect(jsonSchema).to.have.property('properties');
        expect(jsonSchema.properties).to.be.an('object');
      });
    });
  });

  describe('given an agencyComponent with formFields', () => {
    describe('given agency-component-specific fields', () => {
      // These are fields not matching any of the other fields. The section
      // selected is based on the isAgencySpecificFieldSection, currently hard-coded
      let agencyComponent;
      let result;

      beforeEach(() => {
        agencyComponent = {
          title: 'Office of Information Policy',
          formFields: [
            {
              name: 'agency_specific_field',
              title: 'An agency specific field',
            },
          ],
        };

        result = sectionedForm.sectionedFormFromAgencyComponent(agencyComponent);
      });

      it('calls webformFieldsToJsonSchema', () => {
        expect(spy).to.have.been.calledOnce;
      });

      describe('uiSchema', () => {
        let uiSchema;
        beforeEach(() => {
          uiSchema = result.uiSchema;
        });

        it('exists', () => {
          expect(uiSchema).to.be.ok;
        });

        it('has a single section with uiSchema', () => {
          expect(uiSchema).to.deep.equal({
            supporting_docs: {
              agency_specific_field: {
                'ui:title': 'An agency specific field',
                'ui:description': undefined,
              },
              'ui:order': [
                'agency_specific_field',
              ],
            },
          });
        });
      });

      describe('jsonSchema', () => {
        let jsonSchema;
        beforeEach(() => {
          jsonSchema = result.jsonSchema;
        });

        it('exists', () => {
          expect(jsonSchema).to.be.ok;
        });

        it('has a title "Make your request"', () => {
          expect(jsonSchema).to.have.property('title', 'Make your request');
        });

        it('has a type', () => {
          expect(jsonSchema).to.have.property('type', 'object');
        });

        describe('properties', () => {
          let jsonSchemaProperties;
          beforeEach(() => {
            jsonSchemaProperties = jsonSchema.properties;
          });

          it('exists', () => {
            expect(jsonSchemaProperties).to.be.ok;
          });

          it('has an additional fields section property', () => {
            expect(jsonSchemaProperties).to.have.property('supporting_docs');
          });

          describe('supporting_docs', () => {
            let additionalFields;
            beforeEach(() => {
              additionalFields = jsonSchemaProperties.supporting_docs;
            });

            it('exists', () => {
              expect(additionalFields).to.be.ok;
            });

            it('is a jsonSchema object', () => {
              expect(additionalFields).to.have.all.keys([
                'title',
                'description',
                'type',
                'properties',
                'required',
              ]);
            });

            it('has type: object', () => {
              expect(additionalFields).to.have.property('type', 'object');
            });

            it('sets title as section title', () => {
              // TODO this is hardcoded, would be nice to feed it stub data
              expect(additionalFields).to.have.property('title', 'Additional information');
            });

            it('sets description as section description', () => {
              // TODO this is hardcoded, would be nice to feed it stub data
              expect(additionalFields).to.have.property('description');
            });

            it('has the single field as a property', () => {
              expect(additionalFields.properties).to.have.deep.property('agency_specific_field');
            });

            it('has jsonSchema properties', () => {
              expect(additionalFields.properties.agency_specific_field).to.have.all.keys([
                'type',
              ]);
            });
          });
        });
      });
    });

    describe('given two agency-component-specific fields', () => {
      // These are fields not matching any of the other fields. The section
      // selected is based on the isAgencySpecificFieldSection, currently hard-coded
      let agencyComponent;
      let result;

      beforeEach(() => {
        agencyComponent = {
          title: 'Office of Information Policy',
          formFields: [
            {
              name: 'agency_specific_field1',
              title: 'An agency specific field 1',
            },
            {
              name: 'agency_specific_field2',
              title: 'An agency specific field 2',
            },
          ],
        };

        result = sectionedForm.sectionedFormFromAgencyComponent(agencyComponent);
      });

      it('calls webformFieldsToJsonSchema once', () => {
        expect(spy).to.have.been.calledOnce;
      });

      describe('uiSchema', () => {
        let uiSchema;
        beforeEach(() => {
          uiSchema = result.uiSchema;
        });

        it('exists', () => {
          expect(uiSchema).to.be.ok;
        });

        it('has a single section with two fields and uiSchema properties', () => {
          expect(uiSchema).to.have.property('supporting_docs');
          expect(uiSchema.supporting_docs).to.have.all.keys([
            'agency_specific_field1',
            'agency_specific_field2',
            'ui:order',
          ]);
        });
      });

      describe('jsonSchema', () => {
        let jsonSchema;
        beforeEach(() => {
          jsonSchema = result.jsonSchema;
        });

        it('exists', () => {
          expect(jsonSchema).to.be.ok;
        });

        describe('properties', () => {
          let jsonSchemaProperties;
          beforeEach(() => {
            jsonSchemaProperties = jsonSchema.properties;
          });

          it('exists', () => {
            expect(jsonSchemaProperties).to.be.ok;
          });

          it('has a section property with its own jsonSchema properties with two fields', () => {
            expect(jsonSchemaProperties.supporting_docs).to.have.property('properties');
            expect(jsonSchemaProperties.supporting_docs.properties).to.have.all.keys([
              'agency_specific_field1',
              'agency_specific_field2',
            ]);
          });
        });
      });
    });

    describe('given two fields in different sections', () => {
      let agencyComponent;
      let result;

      beforeEach(() => {
        agencyComponent = {
          title: 'Office of Information Policy',
          formFields: [
            {
              name: 'agency_specific_field',
              title: 'An agency specific field',
            },
            {
              name: 'email', // This is hardcoded in the requester_contact section
              title: 'Email ',
            },
          ],
        };

        result = sectionedForm.sectionedFormFromAgencyComponent(agencyComponent);
      });

      it('calls webformFieldsToJsonSchema for each section', () => {
        expect(spy).to.have.been.calledTwice;
        expect(spy).to.have.been.calledWith(sinon.match.array, sinon.match({ id: 'requester_contact' }));
        expect(spy).to.have.been.calledWith(sinon.match.array, sinon.match({ id: 'supporting_docs' }));
      });

      describe('uiSchema', () => {
        let uiSchema;
        beforeEach(() => {
          uiSchema = result.uiSchema;
        });

        it('exists', () => {
          expect(uiSchema).to.be.ok;
        });

        it('has two sections', () => {
          expect(uiSchema).to.have.property('supporting_docs');
          expect(uiSchema).to.have.property('requester_contact');
          expect(uiSchema.supporting_docs).to.have.all.keys([
            'ui:order',
            'agency_specific_field',
          ]);
          expect(uiSchema.requester_contact).to.have.all.keys([
            'ui:order',
            'email',
          ]);
        });
      });

      describe('jsonSchema', () => {
        let jsonSchema;
        beforeEach(() => {
          jsonSchema = result.jsonSchema;
        });

        it('exists', () => {
          expect(jsonSchema).to.be.ok;
        });

        describe('properties', () => {
          let jsonSchemaProperties;
          beforeEach(() => {
            jsonSchemaProperties = jsonSchema.properties;
          });

          it('exists', () => {
            expect(jsonSchemaProperties).to.be.ok;
          });

          it('has two sections', () => {
            expect(jsonSchemaProperties).to.have.property('supporting_docs');
            expect(jsonSchemaProperties).to.have.property('requester_contact');

            expect(jsonSchemaProperties.supporting_docs.properties).to.have.all.keys([
              'agency_specific_field',
            ]);
            expect(jsonSchemaProperties.requester_contact.properties).to.have.all.keys([
              'email',
            ]);
          });
        });
      });
    });
  });
});
