import URLStorePkg from '../index.js';
import test from 'tape';

var { URLStore } = URLStorePkg;

var alphaRegex = /[a-zA-Z]/;

test('Update with encoder', updateWithEncoderTest);
test('Read with decoder', readWithDecoderTest);

function updateWithEncoderTest(t) {
  var location = {
    protocol: 'https:',
    host: 'cat.net',
    pathname: '/hey',
    hash: '#count=5',
  };

  var urlStore = URLStore({
    onUpdate,
    jsonKeys: ['birdlist'],
    numberKeys: ['count'],
    encoder(input, de, charset, type) {
      const s = '' + input;
      if (type === 'key') {
        return s;
      }
      if (type === 'value') {
        return s
          .split('')
          .map((cs) =>
            alphaRegex.test(cs)
              ? String.fromCodePoint(cs.codePointAt(0) + 1)
              : cs,
          )
          .join('');
      }
    },
    windowObject: {
      location,
      history: {
        pushState(a, b, url) {
          location.hash = '#' + url.split('#')[1];
          t.equal(
            url,
            'https://cat.net/hey#birdlist=[{"obnf":"Npdljohcjse","dpmpst":["cmbdl","xijuf"]},{"obnf":"Cmvfkbz","dpmpst":["cmvf"],"nfub":{"dppmoftt":"9","buujuvef":"10"}}]&count=5',
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
        colors: ['black', 'white'],
      },
      {
        name: 'Bluejay',
        colors: ['blue'],
        meta: {
          coolness: '9',
          attitude: '10',
        },
      },
    ],
  });

  function onUpdate(state) {
    t.deepEqual(state, {
      count: 5,
      birdlist: [
        { colors: ['black', 'white'], name: 'Mockingbird' },
        {
          colors: ['blue'],
          meta: { attitude: '10', coolness: '9' },
          name: 'Bluejay',
        },
      ],
    });
    t.end();
  }
}

function readWithDecoderTest(t) {
  var location = {
    protocol: 'https:',
    host: 'cat.net',
    pathname: '/hey',
    hash: '#birdlist=[{"obnf":"Npdljohcjse","dpmpst":["cmbdl","xijuf"]},{"obnf":"Cmvfkbz","dpmpst":["cmvf"],"nfub":{"dppmoftt":"9","buujuvef":"10"}}]&count=5',
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
    decoder(input, de, cs, type) {
      const s = '' + input;
      if (type === 'key') {
        return s;
      }
      if (type === 'value') {
        return s
          .split('')
          .map((cs) =>
            alphaRegex.test(cs)
              ? String.fromCodePoint(cs.codePointAt(0) - 1)
              : cs,
          )
          .join('');
      }
    },
  });

  urlStore.update();

  function onUpdate(state) {
    t.deepEqual(state, {
      count: '5',
      birdlist: [
        { colors: ['black', 'white'], name: 'Mockingbird' },
        {
          colors: ['blue'],
          meta: { attitude: '10', coolness: '9' },
          name: 'Bluejay',
        },
      ],
    });
    t.end();
  }
}
