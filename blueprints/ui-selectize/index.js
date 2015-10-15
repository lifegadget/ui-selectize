module.exports = {
	description: 'Installs the underlying selectize component using bower',
	normalizeEntityName: function() {},
  afterInstall: function() {
   return this.addBowerPackagesToProject([
		 {name: 'selectize', target: '0.12.1'}
	 ]);
 }

};
