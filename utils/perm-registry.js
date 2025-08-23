// utils/perm-registry.js
const CRUD = (name) => [`${name}:list`, `${name}:create`, `${name}:update`, `${name}:delete`];

const PERMISSIONS = [
  // Talep Oluştur (4 alt tip)
  "talep:hasta:create",
  "talep:misafir:create",
  "talep:personel:create",
  "talep:diger:create",

  // Talepler
  "talep:*:list",
  "talep:*:update",
  "talep:*:delete",

  // Tanımlar (CRUD)
  ...CRUD("surucu"),
  ...CRUD("arac"),
  ...CRUD("hastane"),
  ...CRUD("havaalani"),
  ...CRUD("otel"),
  ...CRUD("lokasyon"),
  ...CRUD("ulke"),
];

module.exports = { PERMISSIONS };
