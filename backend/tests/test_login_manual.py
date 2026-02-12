import requests
import sys

def test_login():
    print("Test baslatiliyor...")
    url = "http://127.0.0.1:8001/auth/login"
    payload = {
        "email": "test@example.com",
        "password": "password123"
    }
    
    try:
        print(f"Istek gonderiliyor: {url}")
        response = requests.post(url, json=payload, timeout=5)
        print(f"Yanit alindi. Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("Login Basarili!")
            data = response.json()
            print("Token Turu:", data.get("token_type"))
            # Token cok uzun olabilir, sadece ilk 20 karakteri gosterelim
            token = data.get("access_token")
            if token:
                print(f"Access Token (ilk 20 krk): {token[:20]}...")
            
            if "access_token" in data:
                print("Test GECTI: Token basariyla alindi.")
            else:
                print("Test BASARISIZ: Token yanit icinde yok.")
        else:
            print(f"Login Basarisiz! Status Code: {response.status_code}")
            print("Hata Detayi:", response.text)
            
    except requests.exceptions.Timeout:
        print("Hata: Istek zaman asimina ugradi (timeout).")
    except requests.exceptions.ConnectionError:
        print("Hata: Sunucuya baglanilamadi. Uvicorn calisiyor mu?")
    except Exception as e:
        print(f"Beklenmeyen bir hata olustu: {e}")

if __name__ == "__main__":
    test_login()
