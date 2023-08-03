// Currently, we're using qs instead URLSearchParams for ease of conversion
// to plain JS dicts.
import qs from 'qs';
import cloneDeep from 'lodash.clonedeep';

export function URLStore({
  onUpdate,
  defaults = {},
  windowObject,
  boolKeys = [],
  // TODO: numberKeys
}) {
  // This is where we keep stuff that's only meant to be in-memory
  // and shouldn't be persisted.
  // var inMemoryOnlyDict = {};

  windowObject.onhashchange = onHashChange;

  return {
    update,
    // updateEphemeral,
    moveSearchToHash,

    // These are probably only useful internally,
    // but use them if needed.
    getFromPersistence,
    saveToPersistence,
  };

  function onHashChange() {
    update({});
  }

  // params: Record<string, unknown>
  function update(params) {
    var state = getFromPersistence();
    for (let key in params) {
      state[key] = params[key];
    }
    saveToPersistence(state);

    if (onUpdate) {
      // If getFromPersistence() is different from state, we want to flush that
      // out, so we're calling this here for now.
      onUpdate(getFromPersistence());
    }
  }

  function getFromPersistence() {
    var state = Object.assign(
      defaults,
      qs.parse(windowObject.location.hash.slice(1)),
    );
    return processBoolsAfterDeserialization(state, boolKeys);
  }

  // params: Record<string, unknown>
  function saveToPersistence(params) {
    var dictCopy = prepareBoolsForSerialization(cloneDeep(params), boolKeys);

    var updatedURL =
      windowObject.location.protocol +
      '//' +
      windowObject.location.host +
      windowObject.location.pathname +
      '#' +
      qs.stringify(dictCopy, { sort: basicSort });

    // Sync URL without triggering onhashchange.
    windowObject.history.pushState(null, '', updatedURL);
  }

  function moveSearchToHash() {
    if (!windowObject.location.search || windowObject.location.search === '?') {
      return;
    }
    saveToPersistence(qs.parse(windowObject.location.search.slice(1)));
    windowObject.location.search = '';
  }
}

function prepareBoolsForSerialization(dictCopy, boolKeys) {
  for (var i = 0; i < boolKeys.length; ++i) {
    const prop = boolKeys[i];
    let val = dictCopy[prop];
    if (val) {
      val = 'yes';
    } else {
      val = 'no';
    }
    dictCopy[prop] = val;
  }
  return dictCopy;
}

function processBoolsAfterDeserialization(params, boolKeys) {
  for (var i = 0; i < boolKeys.length; ++i) {
    const prop = boolKeys[i];
    let val = params[prop];
    if (typeof val === 'string') {
      params[prop] = val === 'yes';
    }
  }
  return params;
}

function basicSort(a, b) {
  return a < b ? -1 : 1;
}

export default { URLStore };
