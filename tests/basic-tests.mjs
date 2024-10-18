import URLStorePkg from '../index.js';
import test from 'tape';

var { URLStore } = URLStorePkg;

test('Read from hash', readFromHashTest);
test('Update hash', updateHashTest);
test('Copy from search', copyFromSearchTest);
test('Preserve defaults', preserveDefaultsTest);
test('Update with json key', updateWithJSONTest);
test(
  'Update URL with json that contains encoded chars',
  updateURLWithEncodedJSONTest,
);
test('Read json', readJSONTest);
test('Update with empty json key', updateEmptyJSONTest);
test('Read with empty json key', readEmptyJSONTest);
test('Clear', clearTest);

function readFromHashTest(t) {
  var urlStore = URLStore({
    defaults: {
      flying: true,
    },
    onUpdate,
    boolKeys: ['flying', 'dancing'],
    numberKeys: ['count', 'level'],
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
      count: 5,
      name: 'birds',
      level: 1.5,
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
    numberKeys: ['count', 'level'],
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
      count: 5,
      name: 'birds',
      level: 3,
      flying: false,
      squirrelCount: 2,
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
    numberKeys: ['count', 'level'],
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
    count: 5,
    name: 'birds',
    level: 1.5,
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

function updateWithJSONTest(t) {
  var location = {
    protocol: 'https:',
    host: 'cat.net',
    pathname: '/hey',
    hash: '#count=5',
  };

  var urlStore = URLStore({
    onUpdate,
    jsonKeys: ['birdlist'],
    windowObject: {
      location,
      history: {
        pushState(a, b, url) {
          location.hash = '#' + url.split('#')[1];
          t.equal(
            url,
            'https://cat.net/hey#birdlist=[{"name":"Mockingbird","size":"small","colors":["black","white"]},{"name":"Bluejay","size":"medium","colors":["blue"],"meta":{"coolness":"9","attitude":"10"},"homepage":"https://duckduckgo.com/?t%3Dffab%26q%3Dblue%2Bjay%26ia%3Dweb"}]&count=5',
          );
        },
      },
    },
  });

  urlStore.update({
    count: 5,
    birdlist: [
      {
        name: 'Mockingbird',
        size: 'small',
        colors: ['black', 'white'],
      },
      {
        name: 'Bluejay',
        size: 'medium',
        colors: ['blue'],
        meta: {
          coolness: '9',
          attitude: '10',
        },
        homepage: 'https://duckduckgo.com/?t=ffab&q=blue+jay&ia=web',
      },
    ],
  });

  function onUpdate(state) {
    t.deepEqual(state, {
      count: 5,
      birdlist: [
        { colors: ['black', 'white'], name: 'Mockingbird', size: 'small' },
        {
          colors: ['blue'],
          meta: { attitude: '10', coolness: '9' },
          name: 'Bluejay',
          size: 'medium',
          homepage: 'https://duckduckgo.com/?t=ffab&q=blue+jay&ia=web',
        },
      ],
    });
    t.end();
  }
}

function updateURLWithEncodedJSONTest(t) {
  var location = {
    protocol: 'https:',
    host: 'cat.net',
    pathname: '/hey',
    hash: '#birdlist=[{"name":"Mockingbird","size":"small","colors":["black","white"]},{"name":"Bluejay","size":"medium","colors":["blue"],"meta":{"coolness":"9","attitude":"10"},"homepage":"https://duckduckgo.com/?t%3Dffab%26q%3Dblue%2Bjay%26ia%3Dweb"}]&count=5',
  };

  var urlStore = URLStore({
    onUpdate,
    jsonKeys: ['birdlist'],
    numberKeys: ['count'],
    windowObject: {
      location,
      history: {
        pushState() {},
      },
    },
  });

  urlStore.onHashChange();

  function onUpdate(state) {
    t.deepEqual(state, {
      count: 5,
      birdlist: [
        { colors: ['black', 'white'], name: 'Mockingbird', size: 'small' },
        {
          colors: ['blue'],
          meta: { attitude: '10', coolness: '9' },
          name: 'Bluejay',
          size: 'medium',
          // We expect the url encoded characters to be decoded here.
          homepage: 'https://duckduckgo.com/?t=ffab&q=blue+jay&ia=web',
        },
      ],
    });
    t.end();
  }
}

function readJSONTest(t) {
  var location = {
    protocol: 'https:',
    host: 'cat.net',
    pathname: '/hey',
    hash: '#birdlist=%5B%7B%22name%22%3A%22Mockingbird%22%2C%22size%22%3A%22small%22%2C%22colors%22%3A%5B%22black%22%2C%22white%22%5D%7D%2C%7B%22name%22%3A%22Bluejay%22%2C%22size%22%3A%22medium%22%2C%22colors%22%3A%5B%22blue%22%5D%2C%22meta%22%3A%7B%22coolness%22%3A%229%22%2C%22attitude%22%3A%2210%22%7D%7D%5D&count=5',
  };

  var urlStore = URLStore({
    onUpdate,
    jsonKeys: ['birdlist'],
    windowObject: {
      location,
      history: {
        pushState() {},
      },
    },
  });

  urlStore.update();

  function onUpdate(state) {
    t.deepEqual(state, {
      count: '5',
      birdlist: [
        { colors: ['black', 'white'], name: 'Mockingbird', size: 'small' },
        {
          colors: ['blue'],
          meta: { attitude: '10', coolness: '9' },
          name: 'Bluejay',
          size: 'medium',
        },
      ],
    });
    t.end();
  }
}

function updateEmptyJSONTest(t) {
  var location = {
    protocol: 'https:',
    host: 'cat.net',
    pathname: '/hey',
    hash: '#',
  };

  var urlStore = URLStore({
    onUpdate: () => null,
    jsonKeys: ['birdlist'],
    windowObject: {
      location,
      history: {
        pushState() {},
      },
    },
  });

  t.doesNotThrow(() => urlStore.update({}));
  t.end();
}

function readEmptyJSONTest(t) {
  var location = {
    protocol: 'https:',
    host: 'cat.net',
    pathname: '/hey',
    hash: '#birdlist=',
  };

  var urlStore = URLStore({
    onUpdate: () => null,
    jsonKeys: ['birdlist'],
    windowObject: {
      location,
      history: {
        pushState() {},
      },
    },
  });

  // Normally, we'd have an onUpdate that would do the read. Here, we're just making sure it doesn't crash.
  t.doesNotThrow(urlStore.update);
  t.end();
}

function clearTest(t) {
  var urlStore = URLStore({
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
          // Bool default values should be there, even after a clear.
          t.equal(url, 'https://cat.net/hey#dancing=no&flying=no');
          t.end();
        },
      },
    },
  });

  urlStore.clear();
}
