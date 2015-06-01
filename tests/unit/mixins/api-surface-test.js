import Ember from 'ember';
import ApiSurfaceMixin from 'ui-selectize/mixins/api-surface';
import { module, test } from 'qunit';

module('Unit | Mixin | api surface');

// Replace this with your real tests.
test('it works', function(assert) {
  var ApiSurfaceObject = Ember.Object.extend(ApiSurfaceMixin);
  var subject = ApiSurfaceObject.create();
  assert.ok(subject);
});
