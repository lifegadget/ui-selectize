import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('selectize-render-part', 'Integration | Component | selectize-render-part', {
  integration: true
});

test('it renders', function(assert) {
  this.render(hbs`{{selectize-render-part}}`);
  assert.equal(this.$().text().trim(), '', 'inline renders');

  this.render(hbs`
    {{#selectize-render-part}}
      template block text
    {{/selectize-render-part}}
  `);
  assert.equal(this.$().text().trim(), 'template block text', 'block renders');
});
