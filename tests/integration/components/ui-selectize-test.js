import { moduleForComponent, test } from 'ember-qunit';
import wait from 'ember-test-helpers/wait';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';
const { keys, create } = Object; // jshint ignore:line
const { RSVP: {Promise, all, race, resolve, defer} } = Ember; // jshint ignore:line
const { inject: {service} } = Ember; // jshint ignore:line
const { computed, observe, $, run, on, typeOf } = Ember;  // jshint ignore:line
const { get, set, debug } = Ember; // jshint ignore:line
const a = Ember.A; // jshint ignore:line

moduleForComponent('ui-selectize', 'Integration | Component | ui-selectize', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{ui-selectize}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#ui-selectize}}
      template block text
    {{/ui-selectize}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});

test('tags-input has basic HTML in place', function(assert) {
  this.set('values', ['one','two','three']);
  this.set('options', ['one','two','three','four']);
  this.render(hbs`{{tags-input
    values=values
    options=options
    onChange=(mut values)
  }}`);

  assert.equal(this.$('.ui-selectize').length, 1, 'singular selectize block');
  assert.equal(this.$('.ui-selectize .selectize-control').length, 1, 'singular html select control');
  assert.equal(this.$('.ui-selectize select.tag-input').length, 1, 'ember tag input');
  const selectize = this.$('.ui-selectize select.tag-input')[0].selectize;
  assert.equal(typeOf(selectize), 'object', 'selectize object');
  assert.equal(this.$('.ui-selectize .selectize-dropdown .selectize-dropdown-content').length, 1, 'dropdown and dropdown content divs in place');

  return wait().then(() => {
    assert.equal(selectize.options.length, this.get('options').length, 'selectize object has options');
    assert.equal(selectize.items.length, this.get('values').length, 'selectize object has values');

    assert.equal(this.$('.ui-selectize .selectize-dropdown .option').length, 4, 'options exist in html');
    assert.equal(this.$('.ui-selectize .items .item').length, 3, 'values exist in html');
  });
});

test('select-input has basic HTML in place', function(assert) {
  this.set('value', 'one');
  this.set('options', ['one','two','three','four']);
  this.render(hbs`{{select-input
    value=value
    options=options
    onChange=(mut values)
  }}`);

  assert.equal(this.$('.ui-selectize').length, 1, 'singular selectize block');
  assert.equal(this.$('.ui-selectize .selectize-control').length, 1, 'singular html select control');
  assert.equal(this.$('.ui-selectize select.select-input').length, 1, 'ember tag input');
  const selectize = this.$('.ui-selectize select.select-input')[0].selectize;
  assert.equal(typeOf(selectize), 'object', 'selectize object');
  assert.equal(this.$('.ui-selectize .selectize-dropdown .selectize-dropdown-content').length, 1, 'dropdown and dropdown content divs in place');

  return wait().then(() => {
    console.log('post waiting');
    assert.equal(selectize.options.length, this.get('options').length, 'selectize object has options');
    assert.equal(selectize.getValue(), this.get('value'), 'selectize object has correct value');

    assert.equal(this.$('.ui-selectize .selectize-dropdown .option').length, 4, 'options exist in html');
    assert.equal(this.$('.ui-selectize .selectize-dropdown .selected').length, 1, 'value is selected');
  });
});

test('tags available at initialization', function(assert) {
  assert.expect(2);
  this.set('values', ['one','two','three']);
  this.set('options', ['one','two','three','four']);
  this.render(hbs`{{tags-input
    values=values
    options=options
    onChange=(mut values)
  }}`);
  return wait().then(() => {
    assert.equal($('.ui-selectize .option').length, 4, 'four options available');
    assert.equal($('.ui-selectize .item').length, 3, 'three items tagged');
  });

});

// test('tags with create enabled accept values at initialization', function(assert) {
//   const done = assert.async();
//   assert.expect(3);
//   this.set('values', ['one','two','three']);
//   this.on('onChange', function(hash) {
//     assert.equal(hash.values.length, 3);
//     assert.equal(hash.code, 'suggested-change');
//     done();
//   });
//   this.render(hbs`{{ui-selectize
//     values=values
//     options='one'
//     create=true
//     onChange=(action 'onChange')
//   }}`);
//   run.next(() => {
//     assert.equal(Ember.$('.item').length, 3);
//   });
//
// });
