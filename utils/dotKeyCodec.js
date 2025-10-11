// utils/dotKeyCodec.js
const DOT = /\./g;
const DOLLAR = /\$/g;

// Mongo-safe substitutes
const DOT_SAFE = '\uFF0E';    // FULLWIDTH FULL STOP
const DOLLAR_SAFE = '\uFF04'; // FULLWIDTH DOLLAR SIGN

function encodeKeys(obj) {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj.map(encodeKeys);
  if (typeof obj !== 'object') return obj;

  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const safeKey = k.replace(DOT, DOT_SAFE).replace(DOLLAR, DOLLAR_SAFE);
    out[safeKey] = encodeKeys(v);
  }
  return out;
}

function decodeKeys(obj) {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj.map(decodeKeys);
  if (typeof obj !== 'object') return obj;

  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const origKey = k.replaceAll(DOT_SAFE, '.').replaceAll(DOLLAR_SAFE, '$');
    out[origKey] = decodeKeys(v);
  }
  return out;
}

module.exports = { encodeKeys, decodeKeys, DOT_SAFE, DOLLAR_SAFE };
