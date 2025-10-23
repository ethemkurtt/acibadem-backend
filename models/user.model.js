// models/user.model.js
const mongoose = require("mongoose");
const RoleGroup = require("./roleGroup.model"); // roleGroupId doğrulaması için (opsiyonel)

const userSchema = new mongoose.Schema(
  {
   
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    organizasyon:  { type: String, required: true, trim: true },
    personelGrubu: { type: String, required: true, trim: true },
    roleGroupId:   { type: String, required: true, trim: true }, 

    yetkiler: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    locations: { type: [String], default: [] },
    tc:        { type: String, default: null },
    departman: { type: mongoose.Schema.Types.ObjectId, ref: "Departman", default: null },
    lokasyonlar: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lokasyon" }],
    lokasyon: { type: mongoose.Schema.Types.ObjectId, ref: "Lokasyon", default: null },
    bolge: { type: mongoose.Schema.Types.ObjectId, ref: "Bolge", default: null },
    ulke:  { type: mongoose.Schema.Types.ObjectId, ref: "Ulke", default: null },
    musaitlik:   { type: Boolean, default: true },
    telefon:     { type: String, default: null },
    mail:        { type: String, default: null },
    dogumTarihi: { type: Date, default: null },
    cinsiyet:    { type: String, enum: ["Erkek", "Kadın", "Diğer"], default: null },
    ehliyet:     { type: Boolean, default: false },
    resetPasswordToken:   { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

/* ========= Virtual Populate =========
   User.roleGroupId (string)  <->  RoleGroup.roleGroupId (string)
*/
userSchema.virtual("roleGroup", {
  ref: "RoleGroup",
  localField: "roleGroupId",
  foreignField: "roleGroupId",
  justOne: true,
});

/* ========= (Opsiyonel) roleGroupId doğrulama =========
   İstersen bu bloğu kaldırabilirsin; kaldırırsan her roleGroupId kabul edilir.
*/
userSchema.path("roleGroupId").validate({
  validator: async function (v) {
    if (!v) return false;
    const exists = await RoleGroup.exists({ roleGroupId: v });
    return !!exists;
  },
  message: (props) => `Geçersiz roleGroupId: '${props.value}' — RoleGroup'da bulunamadı.`,
});

/* ========= JSON dönüşümü =========
   - Virtual alanları dahil et
   - Map(yetkiler) -> düz obje
*/
userSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    if (ret?.yetkiler instanceof Map) {
      ret.yetkiler = Object.fromEntries(ret.yetkiler);
    }
    return ret;
  },
});

/* ========= Indexler ========= */
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ roleGroupId: 1 });

module.exports = mongoose.model("User", userSchema);
