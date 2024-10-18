import URLStorePkg from '../index.js';
import test from 'tape';

var { URLStore } = URLStorePkg;

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
    encoder(input, de, charset, type, format, key) {
      console.log('corresponding key', key);
      const s = '' + input;
      if (type === 'key') {
        return s;
      }
      if (type === 'value') {
        return s
          .split('')
          .map((cs) => String.fromCodePoint(cs.codePointAt(0) - 1))
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
            'https://cat.net/hey#birdlist=Zz!m`ld!9!Lnbjhmfahqc!+!bnknqr!9Z!ak`bj!+!vghsd!\\+!tqk!9!gssor9..lnbjhmfahqc-bnl>gdx$2Cxnt$15ahqc$2Cfnnc!|+z!m`ld!9!Aktdi`x!+!bnknqr!9Z!aktd!\\+!lds`!9z!bnnkmdrr!9!8!+!`sshstcd!9!0/!||\\&count=4',
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
        url: 'https://mockingbird.com?hey=you&bird=good',
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
        {
          colors: ['black', 'white'],
          name: 'Mockingbird',
          url: 'https://mockingbird.com?hey=you&bird=good',
        },
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
    hash: '#birdlist=Zz!m`ld!9!Lnbjhmfahqc!+!bnknqr!9Z!ak`bj!+!vghsd!\\+!tqk!9!gssor9..lnbjhmfahqc-bnl>gdx$2Cxnt$15ahqc$2Cfnnc!|+z!m`ld!9!Aktdi`x!+!bnknqr!9Z!aktd!\\+!lds`!9z!bnnkmdrr!9!8!+!`sshstcd!9!0/!||\\&count=4',
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
    decoder(input, de, cs, type, key) {
      console.log('corresponding key', key);
      const s = '' + input;
      if (type === 'key') {
        return s;
      }
      if (type === 'value') {
        const decoded = s
          .split('')
          .map((cs) => String.fromCodePoint(cs.codePointAt(0) + 1))
          .join('');
        console.log('Decoded', input, 'into', decoded);
        return decoded;
      }
    },
  });

  urlStore.update();

  function onUpdate(state) {
    t.deepEqual(state, {
      count: '5',
      birdlist: [
        {
          colors: ['black', 'white'],
          name: 'Mockingbird',
          url: 'https://mockingbird.com?hey=you&bird=good',
        },
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
