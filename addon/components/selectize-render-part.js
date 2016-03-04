import Ember from 'ember';
const { keys, create } = Object; // jshint ignore:line
const { RSVP: {Promise, all, race, resolve, defer} } = Ember; // jshint ignore:line
const { inject: {service} } = Ember; // jshint ignore:line
const { computed, observe, $, run, on, typeOf } = Ember;  // jshint ignore:line
const { get, set, debug } = Ember; // jshint ignore:line
const a = Ember.A; // jshint ignore:line

import layout from '../templates/components/selectize-render-part';

export default Ember.Component.extend({
  layout,
  tagName: '',
  init() {
    this._super(...arguments);
    const {part, register} = this.getProperties('part', 'register');
    run.schedule('afterRender', () => {
      register({
        id: this.elementId,
        part: part,
        getTemplate: Ember.$.proxy(this.getTemplate, this)
      });
    });
  },
  getTemplate() {
    const $find = `#${this.elementId}-for-${get(this, 'containerId')}`;
    return window.$($find).html();
  },
  willDestroyElement() {
    this.get('unregister')(this);
  }
});
