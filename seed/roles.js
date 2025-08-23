// seed/roles.js
import { PERMS } from "./permissions.js";

const all = () => PERMS;

export const ROLES = {
  Admin: all(), // her şey

  Operasyon: [
    "talep:*:list", "talep:*:update",
    "surucu:list","surucu:create","surucu:update",
    "arac:list","arac:create","arac:update",
    "hastane:list","hastane:create","hastane:update",
    "havaalani:list","havaalani:create","havaalani:update",
    "otel:list","otel:create","otel:update",
    "lokasyon:list","lokasyon:create","lokasyon:update",
    "ulke:list","ulke:create","ulke:update",
  ],

  Okuyucu: [
    "talep:*:list",
    "surucu:list","arac:list","hastane:list","havaalani:list","otel:list","lokasyon:list","ulke:list",
  ],

  Sofor: [
    "talep:*:list", // (ileride kendisine atanmış filtre) :contentReference[oaicite:2]{index=2}
  ],

  TalepYapan: [
    "talep:hasta:create","talep:misafir:create","talep:personel:create","talep:diger:create",
    "talep:*:list",
  ],
};
