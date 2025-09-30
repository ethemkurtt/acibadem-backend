const mongoose = require("mongoose");

const takvimSchema = new mongoose.Schema(
  {
    baslik: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 200
    },
    konu: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 1000
    },
    baslangic_tarihi: { 
      type: Date, 
      required: true 
    },
    bitis_tarihi: { 
      type: Date, 
      required: true 
    },
    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    // Kullanıcı bilgilerini de kaydet (populate başarısız olursa fallback için)
    user_name: { type: String, required: true },
    user_email: { type: String, required: true },
    // Takvim etkinliği durumu
    durum: { 
      type: String, 
      enum: ['aktif', 'tamamlandi', 'iptal'],
      default: 'aktif'
    },
    // Renk kodu (isteğe bağlı)
    renk: { 
      type: String, 
      default: '#3b82f6' // Varsayılan mavi renk
    },
    // Hatırlatma (isteğe bağlı)
    hatirlatma: { 
      type: Date, 
      default: null 
    }
  },
  { 
    timestamps: true // createdAt ve updatedAt otomatik eklenir
  }
);

// Index'ler - performans için
takvimSchema.index({ user_id: 1, baslangic_tarihi: 1 });
takvimSchema.index({ user_id: 1, bitis_tarihi: 1 });
takvimSchema.index({ baslangic_tarihi: 1, bitis_tarihi: 1 });

// Validation - bitiş tarihi başlangıç tarihinden sonra olmalı
takvimSchema.pre('save', function(next) {
  if (this.bitis_tarihi < this.baslangic_tarihi) {
    const error = new Error('Bitiş tarihi başlangıç tarihinden önce olamaz');
    error.statusCode = 400;
    return next(error);
  }
  next();
});

module.exports = mongoose.model("Takvim", takvimSchema);
