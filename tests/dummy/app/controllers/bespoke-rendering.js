import Ember from 'ember';
const { keys, create } = Object; // jshint ignore:line
const {computed, observer, $, A, run, on, typeOf, debug, defineProperty, get, set, inject, isEmpty} = Ember;  // jshint ignore:line

export default Ember.Controller.extend({
  item: function(data,escape) {
    return '<div class="item"><a href="' + escape(data.group) + '">' + escape(data.name) + '</a></div>';
  },
  option: function(data,escape) {
    console.log('rendering option');
    return '<div class="option">' +
                  '😎 ' +
                  '<span class="title">' + escape(data.name) + '</span> ' +
                  '<span class="group">(' + escape(data.group) + ')</span>' +
                '</div>';
  },

  things: computed(function() {
    return this.store.findAll('thing');
  }),
  groups: computed(function() {
    return this.store.findAll('group');
  })
});
