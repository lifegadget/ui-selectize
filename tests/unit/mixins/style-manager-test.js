import Ember from 'ember';
import StyleManagerMixin from 'ui-selectize/mixins/style-manager';
import { module, test } from 'qunit';

module('Unit | Mixin | style manager');

// Replace this with your real tests.
test('it works', function(assert) {
  var StyleManagerObject = Ember.Object.extend(StyleManagerMixin);
  var subject = StyleManagerObject.create();
  assert.ok(subject);
});
