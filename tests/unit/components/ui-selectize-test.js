import {
  moduleForComponent,
  test
} from 'ember-qunit';

moduleForComponent('ui-selectize', 'UiSelectizeComponent', {
  // specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar']
});

const defaultOptions = [
    {value:'arm', name:'Arm', group:'body'},
    {value:'leg', name:'Leg', group:'body'},
    {value:'chest', name:'Chest', group:'body'},
    {value:'red', name:'Red', group:'color'},
    {value:'blue', name:'Blue', group:'color'},
    {value:'green', name:'Green', group:'color'},
    {value:'monkey', name:'Monkey', group:'animal'},
    {value:'lion', name:'Lion', group:'animal'},
    {value:'rabbit', name:'Rabbit', group:'animal'}
];

test('it renders', function(assert) {
  assert.expect(2);

  // creates the component instance
  var component = this.subject();
  assert.equal(component._state, 'preRender');

  // appends the component to the page
  this.append();
  assert.equal(component._state, 'inDOM');
});

test('_sortFields resolved from sortFields', function(assert) {
  let component = this.subject();
  component.set('sortField', 'name');
  assert.deepEqual(
    component.get('_sortField'),
    [{field: 'name'}],
    'simple string value translated to single element array of object payload.'
  );
  component.set('sortField', 'name,synonyms');
  assert.deepEqual(
    component.get('_sortField'),
    [{field: 'name'},{field:'synonyms'}],
    'CSV string converted into array items.'
  );
  component.set('sortField', ['name','synonyms']);
  assert.deepEqual(
    component.get('_sortField'),
    [{field: 'name'},{field:'synonyms'}],
    'Simple array converted into array of objects.'
  );
  component.set('sortField', ['name',{field: 'synonyms'}]);
  assert.deepEqual(
    component.get('_sortField'),
    [{field: 'name'},{field:'synonyms'}],
    'Hybrid array converted into array of objects.'
  );

});

test('_options resolved from options', function(assert) {
  let component = this.subject();
  component.set('labelField', 'name'); // will resolve to 'label'
  component.set('valueField', 'value');
  component.set('options', defaultOptions);

  assert.equal(component.get('_options.0.label'), component.get('options.0.name'),
    'the input name should have been mapped to the static "label" property.' );
  assert.equal(component.get('_options.0.value'), component.get('options.0.value'),
    'the value property is the same as the static "value" property.' );
});

// test('_options resolved from promise derived options', function(assert) {
//   let component = this.subject();
//   component.set('labelField', 'name'); // will resolve to 'label'
//   component.set('valueField', 'value');
//   component.set('options', new Promise( resolve => {
//     const data = defaultOptions;
//     run.later( () => {
//       resolve(data);
//     }, 150);
//   }));
//
//   assert.equal(component.get('_options.0.label'), component.get('options.0.name'),
//     'the input name should have been mapped to the static "label" property.' );
//   assert.equal(component.get('_options.0.value'), component.get('options.0.value'),
//     'the value property is the same as the static "value" property.' );
// });

test('deep objects can resolve name and value', function(assert) {
  let component = this.subject();
  let deepOptions = [
    { foo: {value:'arm'}, bar: {name:'Arm'} },
    { foo: {value:'leg'}, bar: {name:'Leg'} },
  ];
  component.set('labelField', 'foo.name'); // will resolve to 'label'
  component.set('valueField', 'bar.value');
  component.set('options',deepOptions);

  assert.equal(component.get('_options.0.label'), component.get('options.0.foo.name'),
    'the input name\'s foo offset should have been removed on _options.' );
  assert.equal(component.get('_options.0.value'), component.get('options.0.bar.value'),
    'the input value\'s bar offset should have been removed on _options' );
});

test('_searchField resolved from searchField', function(assert) {
  let component = this.subject();

  component.set('searchField', 'name');
  assert.deepEqual(component.get('_searchField'), ['name'],
    'a string-based search field should be converted to a one element array' );
  component.set('searchField', ['name']);
  assert.deepEqual(component.get('_searchField'), ['name'],
    'a single array item should remain a one element array' );
  component.set('searchField', ['name','synonyms']);
  assert.deepEqual(component.get('_searchField'), ['name', 'synonyms'],
    'a two element array should remain a two element array' );
  component.set('searchField', 'name,synonyms');
  assert.deepEqual(component.get('_searchField'), ['name', 'synonyms'],
    'two CSV value string should convert to a two element array' );
});

test('setting component value reflected in Selectize', function(assert) {
  let component = this.subject();
  component.set('labelField', 'name'); // will resolve to 'label'
  component.set('valueField', 'value');
  component.set('options', defaultOptions);
  this.append();

  assert.equal(component.get('_options.0.label'), component.get('options.0.name'),
    'the input name should have been mapped to the static "label" property.' );
  assert.equal(component.get('_options.0.value'), component.get('options.0.value'),
    'the value property is the same as the static "value" property.' );
});
