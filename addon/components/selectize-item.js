import Ember from 'ember';
const { keys, create } = Object; // jshint ignore:line
const {computed, observer, $, A, run, on, typeOf, debug, defineProperty, get, set, inject, isEmpty} = Ember;  // jshint ignore:line

import layout from '../templates/components/selectize-item';

export default Ember.Component.extend({
  layout: layout,
  title: 'foobar',
  content: on('didRender', computed(function() {
    return Ember.String.htmlSafe(this.$('div').html());
  })),
  c2: computed('content',function() {
    return this.render(layout);
  }),
});
