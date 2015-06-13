import Ember from 'ember';
import MoodManagerMixin from 'ui-selectize/mixins/mood-manager';
import { module, test } from 'qunit';

module('Unit | Mixin | mood manager');

// Replace this with your real tests.
test('it works', function(assert) {
  var MoodManagerObject = Ember.Object.extend(MoodManagerMixin);
  var subject = MoodManagerObject.create();
  assert.ok(subject);
});
