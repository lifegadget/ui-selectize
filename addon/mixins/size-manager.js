import Ember from 'ember';
const { computed, observer, $, A, run, on, typeOf, debug, keys, get, set, inject } = Ember;    // jshint ignore:line
const SizeManager = Ember.Mixin.create({

  classNameBindings: ['_size'],
  _size: computed('size', function() {
    const size = String(this.get('size')).toLowerCase();
    return size ? `size-${size}` : null;
  })

});

// NAMED FOR EMBER INSPECTOR
SizeManager[Ember.NAME_KEY] = 'size manager';
export default SizeManager;
