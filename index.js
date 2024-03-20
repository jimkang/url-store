// Currently, we're using qs instead URLSearchParams for ease of conversion
// to plain JS dicts.
import qs from 'qs';
import cloneDeep from 'lodash.clonedeep';

var ampRegex = /&/g;
var eqRegex = /=/g;
var plusRegex = /\+/g;

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

    clear,
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
      parseHashString(windowObject.location.hash),
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
      serializeJSONString,
    );

    var updatedURL =
      windowObject.location.protocol +
      '//' +
      windowObject.location.host +
      windowObject.location.pathname +
      '#' +
      qs.stringify(dictCopy, { sort: basicSort, encode: false });

    // Sync URL without triggering onhashchange.
    windowObject.history.pushState(null, '', updatedURL);
  }

  function moveSearchToHash() {
    if (!windowObject.location.search || windowObject.location.search === '?') {
      return;
    }
    saveToPersistence(parseHashString(windowObject.location.search));
    windowObject.location.search = '';
  }

  function parseHashString(s) {
    return qs.parse(s.slice(1), { decode: false });
  }

  function clear() {
    saveToPersistence({});
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

export function serializeBool(val) {
  if (val) {
    return 'yes';
  }
  return 'no';
}

export function deserializeBool(val) {
  if (typeof val === 'boolean') {
    return val;
  }
  if (typeof val === 'string') {
    return val === 'yes';
  }
  return false;
}

export function deserializeJSONString(s) {
  if (s && typeof s === 'string') {
    return JSON.parse(s);
  }
  return s;
}

export function serializeJSONString(value) {
  if (value === undefined) {
    return '';
  }
  // Convert delimiters that cause url problems (&, =, +), but don't encode everything with
  // encodeURIComponent.
  return JSON.stringify(value)
    .replace(ampRegex, '%26')
    .replace(eqRegex, '%3D')
    .replace(plusRegex, '%2B');
}

function basicSort(a, b) {
  return a < b ? -1 : 1;
}

export default { URLStore };
