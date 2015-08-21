import Ember from 'ember';
const { keys, create } = Object; // jshint ignore:line
const {computed, observer, $, A, run, on, typeOf, debug, defineProperty, get, set, inject, isEmpty} = Ember;  // jshint ignore:line
const SizeManager = Ember.Mixin.create({

  classNameBindings: ['_size'],
  _size: computed('size', function() {
    const size = String(this.get('size')).toLowerCase();
    return isEmpty(size) ? '' : `size-${size}`;
  })
});

// NAMED FOR EMBER INSPECTOR
SizeManager[Ember.NAME_KEY] = 'size manager';
export default SizeManager;
