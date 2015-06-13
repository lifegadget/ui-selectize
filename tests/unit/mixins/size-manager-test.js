import Ember from 'ember';
import SizeManagerMixin from 'ui-selectize/mixins/size-manager';
import { module, test } from 'qunit';

module('Unit | Mixin | size manager');

// Replace this with your real tests.
test('it works', function(assert) {
  var SizeManagerObject = Ember.Object.extend(SizeManagerMixin);
  var subject = SizeManagerObject.create();
  assert.ok(subject);
});
