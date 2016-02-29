    export default function(server) {
      server.createList('animal', 5);
      server.loadFixtures('groups');
      server.loadFixtures('things');
    }
