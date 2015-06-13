import Ember from 'ember';
const { computed, observer, $, A, run, on, typeOf, debug, keys, get, set, inject, isEmpty } = Ember;    // jshint ignore:line
const moodManager = Ember.Mixin.create({

  classNameBindings: ['_mood'],
  _mood: computed('mood', function() {
    const mood = String(this.get('mood')).toLowerCase();
    return isEmpty(mood) ? null : `mood-${mood}`;
  })

});

// NAMED FOR EMBER INSPECTOR
moodManager[Ember.NAME_KEY] = 'mood manager';
export default moodManager;
