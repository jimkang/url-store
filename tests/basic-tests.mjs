import URLStorePkg from '../index.js';
import test from 'tape';

var { URLStore } = URLStorePkg;

test('Read from hash', readFromHashTest);
test('Update hash', updateHashTest);

function readFromHashTest(t) {
  var urlStore = URLStore({
    defaults: {
      flying: true,
    },
    onUpdate,
    boolKeys: ['flying', 'dancing'],
    windowObject: {
      location: {
        protocol: 'https',
        host: 'cat.net',
        pathname: '/hey',
        hash: '#count=5&name=birds&level=1.5&dancing=no',
      },
      history: {
        pushState(a, b, url) {
          t.equal(
            url,
            'https://cat.net/hey#flying=yes&count=5&name=birds&level=1.5&dancing=no',
          );
        },
      },
    },
  });

  urlStore.update();

  function onUpdate(state) {
    t.deepEqual(state, {
      count: '5',
      name: 'birds',
      level: '1.5',
      dancing: false,
      flying: true,
    });
    t.end();
  }
}

function updateHashTest(t) {
  var location = {
    protocol: 'https',
    host: 'cat.net',
    pathname: '/hey',
    hash: '#count=5&name=birds&level=1.5',
  };

  var urlStore = URLStore({
    defaults: {
      flying: true,
    },
    onUpdate,
    boolKeys: ['flying'],
    windowObject: {
      location,
      history: {
        pushState(a, b, url) {
          location.hash = '#' + url.split('#')[1];

          t.equal(
            url,
            'https://cat.net/hey#flying=no&count=5&name=birds&level=3&squirrelCount=2',
          );
        },
      },
    },
  });

  urlStore.update({ flying: false, level: 3, squirrelCount: 2 });

  function onUpdate(state) {
    t.deepEqual(state, {
      count: '5',
      name: 'birds',
      level: '3',
      flying: false,
      squirrelCount: '2',
    });
    t.end();
  }
}
