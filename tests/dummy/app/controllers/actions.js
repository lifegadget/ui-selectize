import Ember from 'ember';
const { keys, create } = Object; // jshint ignore:line
const {computed, observer, $, A, run, on, typeOf, debug, defineProperty, get, set, inject, isEmpty} = Ember;  // jshint ignore:line
const htmlSafe = Ember.String.htmlSafe;

export default Ember.Controller.extend({
  flashMessages: inject.service(),
  pojoArray: ['Frog','Monkey','Lion'],
  emberData: computed(function() {
    return this.store.findAll('thing');
  }),
  groups: computed(function() {
    return this.store.findAll('group');
  }),

  actions: {
    onLoad(data) {
      const flashMessages = Ember.get(this, 'flashMessages');
      flashMessages.success(htmlSafe(`<b>onLoad</b>: ${data.count} items loaded`));

      console.log('onLoaded: %o', data);
    },
    onChange(data) {
      const flashMessages = Ember.get(this, 'flashMessages');
      flashMessages.success(htmlSafe(`<b>onChange</b>: added <i>${data.added}</i>. Value(s) are now ${data.values}`));

      console.log('onChange: %o', data);
    },
    onDropdown(data) {
      const flashMessages = Ember.get(this, 'flashMessages');
      if (data.code === 'open-dropdown') {
        flashMessages.success(htmlSafe(`<b>onDropdown</b>: ${data.code}`));
        console.log('onDropdown: %o', data);
      } else {
        flashMessages.warning(htmlSafe(`<b>onDropdown</b>: ${data.code}`));
        console.log('onDropdown: %o', data);
      }
      console.log('onDropdown: %o', data);
    },
    onOption(data) {
      const flashMessages = Ember.get(this, 'flashMessages');
      flashMessages.info(htmlSafe(`<b>onOption</b>: ${data.code} => ${data.added}`));
      console.log('onOption: %o', data);
    },
    onType(data) {
      const flashMessages = Ember.get(this, 'flashMessages');
      flashMessages.info(htmlSafe(`<b>onType</b>: ${data.text}`));
    }
  }
});
