import URLStorePkg from '../index.js';
import test from 'tape';

var { URLStore } = URLStorePkg;

test('Read nested from hash', readFromNestedHashTest);
test('Update nested hash', updateNestedHashTest);

function readFromNestedHashTest(t) {
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
        hash: '#birdlist[0][colors][0]=black&birdlist[0][colors][1]=white&birdlist[0][name]=Mockingbird&birdlist[0][size]=small&birdlist[1][colors][0]=blue&birdlist[1][meta][attitude]=10&birdlist[1][meta][coolness]=9&birdlist[1][name]=Bluejay&birdlist[1][size]=medium&count=5&dancing=no&flying=yes&level=1.5&name=birds',
      },
      history: {
        pushState(a, b, url) {
          t.equal(
            url,
            'https://cat.net/hey#birdlist[0][colors][0]=black&birdlist[0][colors][1]=white&birdlist[0][name]=Mockingbird&birdlist[0][size]=small&birdlist[1][colors][0]=blue&birdlist[1][meta][attitude]=10&birdlist[1][meta][coolness]=9&birdlist[1][name]=Bluejay&birdlist[1][size]=medium&count=5&dancing=no&flying=yes&level=1.5&name=birds',
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
        },
      ],
    });
    t.end();
  }
}

function updateNestedHashTest(t) {
  var location = {
    protocol: 'https:',
    host: 'cat.net',
    pathname: '/hey',
    hash: '#count=5&name=birds&level=1.5&birdlist%5B0%5D%5Bname%5D=Mockingbird&birdlist%5B0%5D%5Bsize%5D=small&birdlist%5B0%5D%5Bcolors%5D%5B0%5D=black&birdlist%5B0%5D%5Bcolors%5D%5B1%5D=white&birdlist%5B1%5D%5Bname%5D=Bluejay&birdlist%5B1%5D%5Bsize%5D=medium&birdlist%5B1%5D%5Bcolors%5D%5B0%5D=blue&birdlist%5B1%5D%5Bmeta%5D%5Bcoolness%5D=9&birdlist%5B1%5D%5Bmeta%5D%5Battitude%5D=10',
  };

  var urlStore = URLStore({
    defaults: {
      flying: true,
    },
    onUpdate,
    boolKeys: ['flying'],
    numberKeys: ['count', 'level', 'squirrelCount'],
    windowObject: {
      location,
      history: {
        pushState(a, b, url) {
          location.hash = '#' + url.split('#')[1];

          t.equal(
            url,
            'https://cat.net/hey#birdlist[0][colors][0]=blue&birdlist[0][meta][attitude]=11&birdlist[0][meta][coolness]=9&birdlist[0][name]=Bluejay&birdlist[0][size]=medium&birdlist[1][colors][0]=black&birdlist[1][name]=Crow&birdlist[1][size]=large&count=5&flying=no&level=3&name=birds&squirrelCount=2',
          );
        },
      },
    },
  });

  urlStore.update({
    flying: false,
    level: 3,
    squirrelCount: 2,
    birdlist: [
      {
        name: 'Bluejay',
        size: 'medium',
        colors: ['blue'],
        meta: {
          coolness: 9,
          attitude: 11,
        },
      },
      {
        name: 'Crow',
        size: 'large',
        colors: ['black'],
      },
    ],
  });

  function onUpdate(state) {
    t.deepEqual(state, {
      count: 5,
      name: 'birds',
      level: 3,
      flying: false,
      squirrelCount: 2,
      birdlist: [
        {
          name: 'Bluejay',
          size: 'medium',
          colors: ['blue'],
          meta: {
            coolness: 9,
            attitude: 11,
          },
        },
        {
          name: 'Crow',
          size: 'large',
          colors: ['black'],
        },
      ],
    });
    t.end();
  }
}
