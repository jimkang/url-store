// Currently, we're using qs instead URLSearchParams for ease of conversion
// to plain JS dicts.
import qs from 'qs';
import cloneDeep from 'lodash.clonedeep';

export function URLStore({
  onUpdate,
  defaults = {},
  windowObject,
  boolKeys = [],
  jsonKeys = [],
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
      {}, // Make sure to use defaults, not to write to them.
      defaults,
      qs.parse(windowObject.location.hash.slice(1)),
    );
    return processSpecialsAfterDeserialization(
      processSpecialsAfterDeserialization(state, boolKeys, deserializeBool),
      jsonKeys,
      deserializeJSONString,
    );
  }

  // params: Record<string, unknown>
  function saveToPersistence(params) {
    var dictCopy = prepareSpecialsForSerialization(
      prepareSpecialsForSerialization(
        cloneDeep(params),
        boolKeys,
        serializeBool,
      ),
      jsonKeys,
      JSON.stringify,
    );

    var updatedURL =
      windowObject.location.protocol +
      '//' +
      windowObject.location.host +
      windowObject.location.pathname +
      '#' +
      decodeURIComponent(qs.stringify(dictCopy, { sort: basicSort }));

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

function prepareSpecialsForSerialization(
  dictCopy,
  specialKeys,
  serializeValue,
) {
  for (var i = 0; i < specialKeys.length; ++i) {
    const prop = specialKeys[i];
    dictCopy[prop] = serializeValue(dictCopy[prop]);
  }
  return dictCopy;
}

function processSpecialsAfterDeserialization(
  params,
  specialKeys,
  deserializeValue,
) {
  for (var i = 0; i < specialKeys.length; ++i) {
    const prop = specialKeys[i];
    params[prop] = deserializeValue(params[prop]);
  }
  return params;
}

function serializeBool(val) {
  if (val) {
    return 'yes';
  }
  return 'no';
}

function deserializeBool(val) {
  if (typeof val === 'boolean') {
    return val;
  }
  if (typeof val === 'string') {
    return val === 'yes';
  }
  return false;
}

function deserializeJSONString(s) {
  if (typeof s === 'string') {
    return JSON.parse(s);
  }
  return s;
}

function basicSort(a, b) {
  return a < b ? -1 : 1;
}

export default { URLStore };
