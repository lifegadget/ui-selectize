import Ember from 'ember';
const { keys, create } = Object; // jshint ignore:line
const {computed, observer, $, A, run, on, typeOf, debug, defineProperty, get, set, inject, isEmpty} = Ember;  // jshint ignore:line

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
     flashMessages.info(`onLoad Event: ${data.count} items loaded`);

     console.log('Loaded: %o', data);
   },
   onChange(data) {
    const flashMessages = Ember.get(this, 'flashMessages');
    flashMessages.success(`onChange Event: ${data.value}`);

    console.log('onChange: %o', data);
  },
  onDropdown(data) {
    const flashMessages = Ember.get(this, 'flashMessages');
    if(data.action === 'open') {
      flashMessages.success(`onDropdown Event: ${data.action}`);
      console.log('Dropdown open: %o', data);
    } else {
      flashMessages.danger(`onDropdownClose Event`);
      console.log('Dropdown close: %o', data);
    }
  },
  onItem(data) {
    const flashMessages = Ember.get(this, 'flashMessages');
    flashMessages.success(`onItem Event: ${data.text}`);
  },
  onOption(data) {
    const flashMessages = Ember.get(this, 'flashMessages');
    flashMessages.info(`onOption Event: ${data.action} => ${data.option}`);
  },
  onType(data) {
    const flashMessages = Ember.get(this, 'flashMessages');
    flashMessages.success(`onType Event: ${data.text}`);
  }
}
});
