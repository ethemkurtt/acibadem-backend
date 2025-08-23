// seed/permissions.js
const CRUD = (name) => [`${name}:list`, `${name}:create`, `${name}:update`, `${name}:delete`];

export const PERMS = [
  // Talep Oluştur (4 alt tip) — hasta/misafir/personel/diğer
  "talep:hasta:create",
  "talep:misafir:create",
  "talep:personel:create",
  "talep:diger:create", // :contentReference[oaicite:0]{index=0}

  // Talepler (liste/güncelle/sil)
  "talep:*:list",
  "talep:*:update",
  "talep:*:delete",

  // Tanımlar (Sürücü, Araç, Hastane, Havaalanı, Otel, Lokasyon, Ülke) — CRUD
  ...CRUD("surucu"),
  ...CRUD("arac"),
  ...CRUD("hastane"),
  ...CRUD("havaalani"),
  ...CRUD("otel"),
  ...CRUD("lokasyon"),
  ...CRUD("ulke"), // :contentReference[oaicite:1]{index=1}
];

export const PERM_SET = new Set(PERMS);
