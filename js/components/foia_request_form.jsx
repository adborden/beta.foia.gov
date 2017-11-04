import React from 'react';
import PropTypes from 'prop-types';
import Form from 'react-jsonschema-form';
import { Map } from 'immutable';

import USWDSRadioWidget from 'components/uswds_radio_widget';
import USWDSCheckboxWidget from 'components/uswds_checkbox_widget';
import { requestActions } from '../actions';
import { SubmissionResult } from '../models';
import ObjectFieldTemplate from './object_field_template';
import rf from '../util/request_form';
import FoiaFileWidget from './foia_file_widget';
import { dataUrlToAttachment, findFileFields } from '../util/attachment';
import UploadProgress from './upload_progress';


function FoiaRequestForm({ formData, upload, onSubmit, requestForm, submissionResult }) {
  function onChange({ formData: data }) {
    requestActions.updateRequestForm(data);
  }

  function onFormSubmit({ formData: data }) {
    // Merge the sections into a single payload
    const payload = rf.mergeSectionFormData(data);

    // Transform file fields to attachments
    findFileFields(requestForm)
      .filter(fileFieldName => fileFieldName in payload)
      .forEach((fileFieldName) => {
        payload[fileFieldName] = dataUrlToAttachment(payload[fileFieldName]);
      });

    // Submit the request
    return requestActions
      .submitRequestForm(
        Object.assign(
          // Merge the sections into a single payload
          payload,
          // Add the form Id so the API knows what form we're submitting for
          { id: requestForm.id },
        ),
      )
      .then(() => {
        // Submission successful
        onSubmit();
      });
  }

  const widgets = {
    CheckboxWidget: USWDSCheckboxWidget,
    RadioWidget: USWDSRadioWidget,
    FileWidget: FoiaFileWidget,
  };

  // Map these to react-jsonschema-form Ids
  const steps = (requestForm.sections || []).map(section => `root_${section.id}`);

  const formContext = { steps };
  const { jsonSchema, uiSchema } = requestForm;
  return (
    <Form
      className="foia-request-form"
      disabled={upload.get('inProgress')}
      formContext={formContext}
      formData={formData.toJS()}
      ObjectFieldTemplate={ObjectFieldTemplate}
      onChange={onChange}
      onSubmit={onFormSubmit}
      schema={jsonSchema}
      uiSchema={uiSchema}
      widgets={widgets}
    >
      <div id="foia-request-form_submit" className="foia-request-form_submit">
        <p>Please review the information you’ve entered and submit.</p>
        <p>
          You should hear from the agency you’ve submitted a records request to
          within 10 days. If you don’t hear from the agency, please reach out
          using the contact information provided to you on this site.
        </p>
        <button type="submit" disabled={upload.get('inProgress')}>Submit</button>
        { upload.get('inProgress') &&
          <UploadProgress
            progressTotal={upload.get('progressTotal')}
            progressLoaded={upload.get('progressLoaded')}
          />
        }
        { submissionResult.errorMessage &&
          <p>
            <span className="usa-input-error-message" role="alert">
              {submissionResult.errorMessage}
            </span>
          </p>
        }
      </div>
    </Form>
  );
}

FoiaRequestForm.propTypes = {
  formData: PropTypes.object.isRequired,
  upload: PropTypes.instanceOf(Map).isRequired,
  onSubmit: PropTypes.func,
  requestForm: PropTypes.object.isRequired,
  submissionResult: PropTypes.instanceOf(SubmissionResult).isRequired,
};

FoiaRequestForm.defaultProps = {
  onSubmit: () => {},
};


export default FoiaRequestForm;
