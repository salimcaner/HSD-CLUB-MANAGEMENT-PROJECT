import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
from fastapi import HTTPException, status
from email.header import Header

def send_invite_email(to_email: str, invite_link: str, first_name: str, last_name: str):
    """
    Sends an invitation email to the user with the generated invite link.
    """
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        print("!!! SMTP AYARLARI EKSİK! E-POSTA GÖNDERİLEMEDİ: SMTP_USERNAME veya SMTP_PASSWORD bulunamadı.")
        print(f"!!! OLUŞTURULAN DAVET LİNKİ: {invite_link}")
        # Eğer SMTP ayarları yoksa geliştirme ortamındadır diye linki loglayıp devam edebilir veya hata fırlatabiliriz.
        # Hata fırlatmayı seçiyoruz.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SMTP e-posta ayarları eksik. Lütfen .env dosyanızı kontrol edin."
        )

    msg = MIMEMultipart()
    msg['From'] = settings.SMTP_FROM_EMAIL
    msg['To'] = to_email
    msg['Subject'] = Header("Kulüp Yönetim Sistemi - Davet", 'utf-8')

    html_content = f"""
    <html>
      <body>
        <h2>Merhaba {first_name} {last_name},</h2>
        <p>Kulüp Yönetim Sistemi'ne davet edildiniz!</p>
        <p>Hesabınızı oluşturmak ve şifrenizi belirlemek için lütfen aşağıdaki linke tıklayın:</p>
        <p><a href="{invite_link}" style="display:inline-block;padding:10px 20px;color:white;background-color:#007BFF;text-decoration:none;border-radius:5px;">Hesabımı Oluştur</a></p>
        <br>
        <p>Veya bu linki kopyalayıp tarayıcınıza yapıştırabilirsiniz:</p>
        <p>{invite_link}</p>
        <br>
        <p>İyi günler dileriz.</p>
      </body>
    </html>
    """

    msg.attach(MIMEText(html_content, 'html','utf-8'))

    try:
        if settings.SMTP_PORT == 465:
            # 465 portu genelde direk SSL ister
            server = smtplib.SMTP_SSL(settings.SMTP_SERVER, settings.SMTP_PORT)
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        else:
            # 587 gibi diğer portlar STARTTLS kullanır
            server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            
        server.send_message(msg)
        server.quit()
        print(f"!!! E-POSTA BAŞARIYLA GÖNDERİLDİ: {to_email}")
    except Exception as e:
        print(f"!!! E-POSTA GÖNDERME HATASI: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Davet e-postası gönderilemedi. Hata: {str(e)}"
        )
