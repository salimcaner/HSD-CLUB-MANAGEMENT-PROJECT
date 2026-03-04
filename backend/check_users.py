from app.core.supabase_client import get_supabase
from app.schemas.user import User

supabase = get_supabase()
response = supabase.table("profiles").select("*").execute()

for user_dict in response.data:
    if "class" in user_dict:
        user_dict["class_"] = user_dict.pop("class")
    try:
        User(**user_dict)
    except Exception as e:
        print(f"Error for user: {user_dict.get('email', 'unknown')}")
        print(e)
        print("-" * 40)
