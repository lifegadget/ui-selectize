import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('selectize-render-part', 'Integration | Component | selectize render part', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });"

  this.render(hbs`{{selectize-render-part}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:"
  this.render(hbs`
    {{#selectize-render-part}}
      template block text
    {{/selectize-render-part}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
