    export default function(server) {
      server.createList('animal', 10);
      server.loadFixtures('groups');
      server.loadFixtures('things');
      server.loadFixtures('animal-groups');
    }
