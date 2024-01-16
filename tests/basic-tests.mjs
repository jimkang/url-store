import URLStorePkg from '../index.js';
import test from 'tape';

var { URLStore } = URLStorePkg;

test('Read from hash', readFromHashTest);
test('Update hash', updateHashTest);
test('Copy from search', copyFromSearchTest);
test('Preserve defaults', preserveDefaultsTest);

function readFromHashTest(t) {
  var urlStore = URLStore({
    defaults: {
      flying: true,
    },
    onUpdate,
    boolKeys: ['flying', 'dancing'],
    windowObject: {
      location: {
        protocol: 'https:',
        host: 'cat.net',
        pathname: '/hey',
        hash: '#count=5&name=birds&level=1.5&dancing=no',
      },
      history: {
        pushState(a, b, url) {
          t.equal(
            url,
            'https://cat.net/hey#count=5&dancing=no&flying=yes&level=1.5&name=birds',
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
    protocol: 'https:',
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
            'https://cat.net/hey#count=5&flying=no&level=3&name=birds&squirrelCount=2',
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

function copyFromSearchTest(t) {
  var location = {
    protocol: 'http:',
    host: 'cat.net:8000',
    pathname: '',
    search: '?count=5&name=birds&level=1.5',
  };

  var urlStore = URLStore({
    defaults: {
      flying: true,
    },
    boolKeys: ['flying'],
    windowObject: {
      location,
      history: {
        pushState(a, b, url) {
          location.hash = '#' + url.split('#')[1];
          // Could revisit this later, but defaults are only applied on gets.
          t.equal(
            url,
            'http://cat.net:8000#count=5&flying=no&level=1.5&name=birds',
          );
        },
      },
    },
  });

  var expectedState = {
    count: '5',
    name: 'birds',
    level: '1.5',
    flying: false,
  };

  urlStore.moveSearchToHash();

  t.deepEqual(urlStore.getFromPersistence(), expectedState);

  // Trigger another save. The pushState hash and the state should be the same.
  urlStore.update({});
  t.deepEqual(urlStore.getFromPersistence(), expectedState);

  t.end();
}

function preserveDefaultsTest(t) {
  var defaults = {
    flying: true,
  };

  var location = {
    protocol: 'https:',
    host: 'cat.net',
    pathname: '/hey',
    hash: '#',
  };
  var urlStore = URLStore({
    defaults,
    onUpdate,
    boolKeys: ['flying'],
    windowObject: {
      location,
      history: {
        pushState(a, b, url) {
          location.hash = '#' + url.split('#')[1];
        },
      },
    },
  });

  urlStore.update({ flying: false });

  function onUpdate(state) {
    t.deepEqual(state, { flying: false }, 'Passed state is correct.');
    t.deepEqual(defaults, { flying: true }, 'Defaults are unchanged.');
    t.end();
  }
}
