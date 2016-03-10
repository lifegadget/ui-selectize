import Ember from 'ember';
const { keys, create } = Object; // jshint ignore:line
const {computed, observer, $, A, run, on, typeOf, debug, defineProperty, get, set, inject, isEmpty} = Ember;  // jshint ignore:line


export default Ember.Controller.extend({
  optGroup: [
    {id: 'color', name: 'Colors'},
    {id: 'animal', name: 'Animals'},
    {id: 'body', name: 'Body'}
  ],
  things: computed(function() {
    return this.store.findAll('thing');
  }),
  groups: computed(function() {
    return this.store.findAll('group');
  }),



});
