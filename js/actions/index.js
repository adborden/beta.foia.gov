import assert from 'assert';

import dispatcher from '../util/dispatcher';
import jsonapi from '../util/json_api';
import requestapi from '../util/request_api';


// Action types to identify an action
export const types = {
  AGENCY_FINDER_DATA_FETCH: 'AGENCY_FINDER_DATA_FETCH',
  AGENCY_FINDER_DATA_RECEIVE: 'AGENCY_FINDER_DATA_RECEIVE',
  AGENCY_COMPONENT_FETCH: 'AGENCY_COMPONENT_FETCH',
  AGENCY_COMPONENT_RECEIVE: 'AGENCY_COMPONENT_RECEIVE',
  REQUEST_FORM_UPDATE: 'REQUEST_FORM_UPDATE',
  REQUEST_FORM_SUBMIT: 'REQUEST_FORM_SUBMIT',
  REQUEST_FORM_SUBMIT_COMPLETE: 'REQUEST_FORM_SUBMIT_COMPLETE',
  REQUEST_FORM_SUBMIT_PROGRESS: 'REQUEST_FORM_SUBMIT_PROGRESS',
};

// Action creators, to dispatch actions
export const requestActions = {
  fetchAgencyFinderData() {
    dispatcher.dispatch({
      type: types.AGENCY_FINDER_DATA_FETCH,
    });

    return jsonapi.params()
      .include('agency')
      .fields('agency', ['name', 'abbreviation', 'description'])
      .fields('agency_component', ['title', 'abbreviation', 'agency'])
      .limit(50) // Maximum allowed by drupal
      .paginate('/agency_components', requestActions.receiveAgencyFinderData);
  },

  receiveAgencyFinderData(agencyComponents) {
    dispatcher.dispatch({
      type: types.AGENCY_FINDER_DATA_RECEIVE,
      agencyComponents,
    });

    return Promise.resolve(agencyComponents);
  },

  fetchAgencyComponent(agencyComponentId) {
    assert(agencyComponentId, 'You must provide an agencyComponentId to fetchAgencyComponent.');
    dispatcher.dispatch({
      type: types.AGENCY_COMPONENT_FETCH,
      agencyComponentId,
    });

    return jsonapi.params()
      .include('agency')
      .include('field_misc')
      .include('foia_officers')
      .include('paper_receiver')
      .include('public_liaisons')
      .include('request_form')
      .include('service_centers')
      .get(`/agency_components/${agencyComponentId}`);
  },

  receiveAgencyComponent(agencyComponent) {
    dispatcher.dispatch({
      type: types.AGENCY_COMPONENT_RECEIVE,
      agencyComponent,
    });

    return Promise.resolve(agencyComponent);
  },

  updateRequestForm(formData) {
    dispatcher.dispatch({
      type: types.REQUEST_FORM_UPDATE,
      formData,
    });

    return Promise.resolve();
  },

  submitRequestForm(formData) {
    dispatcher.dispatch({
      type: types.REQUEST_FORM_SUBMIT,
      formData,
    });

    const options = {
      onUploadProgress: requestActions.submitRequestFormProgress,
    };

    return requestapi.post('/webform/submit', formData, options)
      .catch((error) => {
        const defaultErrorMessage = 'Sorry, something went wrong and your request could not be submitted.';
        const submissionResult = {
          errorMessage: error.message || defaultErrorMessage,
        };

        if (error.message === 'Network Error') {
          // Network Error isn't any more helpful than our default message
          submissionResult.errorMessage = 'The connection failed and your request could not be submitted. Please try again later.';
        }

        if (error.code === 'ECONNABORTED') {
          submissionResult.errorMessage =
            'The connection timed out and your request could not be submitted. Please try again.';
        }

        if (error.response && error.response.data && error.response.data.errors) {
          submissionResult.errors = error.response.data.errors;
        }

        return Promise.resolve(submissionResult);
      })
      .then(requestActions.completeSubmitRequestForm);
  },

  submitRequestFormProgress(progress) {
    dispatcher.dispatch({
      type: types.REQUEST_FORM_SUBMIT_PROGRESS,
      progress,
    });

    return Promise.resolve();
  },

  completeSubmitRequestForm(submissionResult) {
    dispatcher.dispatch({
      type: types.REQUEST_FORM_SUBMIT_COMPLETE,
      submissionResult,
    });

    return submissionResult.errorMessage ? Promise.reject() : Promise.resolve();
  },
};
