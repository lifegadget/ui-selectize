import Ember from 'ember';
const { keys, create } = Object; // jshint ignore:line
const {computed, observer, $, A, run, on, typeOf, debug, defineProperty, get, set, inject, isEmpty} = Ember;  // jshint ignore:line
const dasherize = thingy => {
  return thingy ? Ember.String.dasherize(thingy) : thingy;
};

export default Ember.Controller.extend({
  pojoArray: ['Frog','Monkey','Lion'],
  emberData: computed(function() {
    return this.store.findAll('animal');
  }),

  actions: {
    onChange(action,o) {
      if(action === 'selected') {
        const route = dasherize(get(o,'title'));
        this.transitionToRoute(`${route}`);
      }
    }
  }
});
