// Currently, we're using qs instead URLSearchParams for ease of conversion
// to plain JS dicts.
import qs from 'qs';
import cloneDeep from 'lodash.clonedeep';

var ampRegex = /&/g;
var eqRegex = /=/g;
var plusRegex = /\+/g;
var escapedAmpRegex = /%26/g;
var escapedEqRegex = /%3D/g;
var escapedPlusRegex = /%2B/g;

export function URLStore({
  onUpdate,
  defaults = {},
  windowObject,
  boolKeys = [],
  jsonKeys = [],
  // These correspond to JSON values which should not be escaped after stringifying
  // or unescaped before parsing.
  rawJSONKeys = [],
  numberKeys = [],
  encoder,
  decoder,
}) {
  var deserializatonParams = [
    { targetKeys: boolKeys, op: deserializeBool },
    { targetKeys: numberKeys, op: deserializeNumber },
    { targetKeys: jsonKeys, op: deserializeJSONString },
    { targetKeys: rawJSONKeys, op: deserializeJSONStringRaw },
  ];
  var serializatonParams = [
    { targetKeys: boolKeys, op: serializeBool },
    { targetKeys: numberKeys, op: serializeNumber },
    { targetKeys: jsonKeys, op: serializeJSONString },
    { targetKeys: rawJSONKeys, op: serializeJSONStringRaw },
  ];

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
    onHashChange,

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
      onUpdate(state);
    }
  }

  function getFromPersistence() {
    var state = Object.assign(
      {}, // Make sure to use defaults, not to write to them.
      defaults,
      parseHashString(windowObject.location.hash),
    );
    return deserializatonParams.reduce(
      (latestState, { targetKeys, op }) =>
        processSpecialsAfterDeserialization(latestState, targetKeys, op),
      state,
    );
  }

  // params: Record<string, unknown>
  function saveToPersistence(params) {
    var dictCopy = serializatonParams.reduce(
      (latestState, { targetKeys, op }) =>
        prepareSpecialsForSerialization(latestState, targetKeys, op),
      cloneDeep(params),
    );

    var updatedURL =
      windowObject.location.protocol +
      '//' +
      windowObject.location.host +
      windowObject.location.pathname +
      '#' +
      qs.stringify(dictCopy, { sort: basicSort, encode: !!encoder, encoder });

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
    const parsed = qs.parse(s.slice(1), { decode: !!decoder, decoder });
    // debugger;
    return parsed;
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

export function deserializeNumber(val) {
  if (typeof val === 'number') {
    return val;
  }
  if (typeof val === 'string') {
    return +val;
  }
  return false;
}

export function serializeNumber(val) {
  return '' + val;
}

export function deserializeJSONString(s) {
  if (!s || typeof s !== 'string') {
    return s;
  }

  const unescapedS = s
    .replace(escapedAmpRegex, '&')
    .replace(escapedEqRegex, '=')
    .replace(escapedPlusRegex, '+');

  // console.log('incoming string:', s, 'unescaped:', unescapedS);
  return JSON.parse(unescapedS);
}

function deserializeJSONStringRaw(s) {
  if (!s || typeof s !== 'string') {
    return s;
  }

  return JSON.parse(s);
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

function serializeJSONStringRaw(value) {
  if (value === undefined) {
    return '';
  }
  return JSON.stringify(value);
}

function basicSort(a, b) {
  return a < b ? -1 : 1;
}

export default { URLStore };
