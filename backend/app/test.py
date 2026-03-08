from app.core.supabase_client import get_supabase
def test_supabase_buckets():
    print("\n🚀 Supabase Bağlantısı Test Ediliyor...")
    
    try:
        supabase = get_supabase()
        
        # Supabase Storage'daki tüm bucket'ları (klasörleri) getirir
        response = supabase.storage.list_buckets()
        
        print("\n✅ BAĞLANTI BAŞARILI! İşte mevcut Bucket'larınız (Klasörleriniz):")
        print("-" * 40)
        
        # Bucket gelmediyse uyar
        if not response:
            print("❌ Hiçbir bucket bulunamadı! Lütfen Supabase Storage panelinden bir bucket oluşturun.")
            return
        # Gelen bucket' isimlerini tek tek ekrana yazdır
        for idx, bucket in enumerate(response):
            # Supabase Python kütüphanesinin sürümlerine göre response objesi farklılık gösterebilir.
            # Klasik kullanımda 'bucket.name' veya sözlük yapısındaysa 'bucket["name"]' alınır.
            try:
                bucket_name = bucket.name
            except AttributeError:
                bucket_name = bucket.get("name", "Bilinmeyen İsim")
                
            print(f"{idx + 1}. Kova (Bucket) Adı: {bucket_name}")
            
        print("-" * 40)
        print("💡 Lütfen yukarıdaki listede yazan isimleri, kodlarınıza birebir kopyalayın!\n")
        
    except Exception as e:
        print(f"\n❌ BAĞLANTI HATASI: {str(e)}")
        print("Lütfen .env dosyanızdaki SUPABASE_URL ve SUPABASE_KEY değerlerinin doğru olduğundan emin olun.")
# Bu dosya doğrudan çalıştırıldığında test fonksiyonunu çalıştırır
if __name__ == "__main__":
    test_supabase_buckets()