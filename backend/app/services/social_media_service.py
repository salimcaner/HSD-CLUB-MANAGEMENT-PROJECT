from typing import Optional
from fastapi import HTTPException
from app.core.supabase_client import get_supabase

supabase = get_supabase()


def create_social_post_service(
    platform: str,
    post_date: str,
    likes: int,
    comments: int,
    views: int,
    added_by: str,
    title: Optional[str] = None,
    post_url: Optional[str] = None
):
    try:
        post_data = {
            "platform": platform,
            "title": title,
            "post_url": post_url,
            "post_date": post_date,
            "likes": likes,
            "comments": comments,
            "views": views,
            "added_by": added_by
        }
        response = supabase.table("social_media_posts").insert(post_data).execute()

        if response.data:
            return response.data[0]
        raise Exception("Veritabanına kayıt başarısız.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Post oluşturulurken hata: {str(e)}")


def get_all_social_posts_service(platform: Optional[str] = None, limit: int = 50, offset: int = 0):
    try:
        query = supabase.table("social_media_posts").select("*").order("post_date", desc=True)

        if platform:
            query = query.eq("platform", platform)

        end_index = offset + limit - 1
        query = query.range(offset, end_index)

        response = query.execute()
        return response.data
    except Exception as e:
        raise Exception(f"Postlar getirilirken hata: {str(e)}")


def get_social_post_by_id_service(post_id: int):
    try:
        response = supabase.table("social_media_posts").select("*").eq("id", post_id).execute()

        if not response.data:
            return None
        return response.data[0]
    except Exception as e:
        raise Exception(f"Post detayı getirilirken hata: {str(e)}")


def update_social_post_service(
    post_id: int,
    user_role: str,
    platform: str,
    post_date: str,
    likes: int,
    comments: int,
    views: int,
    title: Optional[str] = None,
    post_url: Optional[str] = None
):
    try:
        response = supabase.table("social_media_posts").select("*").eq("id", post_id).execute()

        if not response.data:
            return {"success": False, "message": "Güncellenecek post bulunamadı."}

        if user_role in ["uye", "mezun"]:
            return {"success": False, "message": "Bu işlemi gerçekleştirmek için yetkiniz yok."}

        update_data = {
            "platform": platform,
            "title": title,
            "post_url": post_url,
            "post_date": post_date,
            "likes": likes,
            "comments": comments,
            "views": views
        }

        update_response = supabase.table("social_media_posts").update(update_data).eq("id", post_id).execute()

        if update_response.data:
            return {"success": True, "message": "Post başarıyla güncellendi.", "data": update_response.data[0]}
        return {"success": False, "message": "Güncelleme başarısız."}
    except Exception as e:
        return {"success": False, "message": f"Güncelleme sırasında hata: {str(e)}"}


def delete_social_post_service(post_id: int, user_role: str):
    try:
        response = supabase.table("social_media_posts").select("*").eq("id", post_id).execute()

        if not response.data:
            return {"success": False, "message": "Silinecek post bulunamadı."}

        if user_role in ["uye", "mezun"]:
            return {"success": False, "message": "Bu işlemi gerçekleştirmek için yetkiniz yok."}

        supabase.table("social_media_posts").delete().eq("id", post_id).execute()
        return {"success": True, "message": "Post başarıyla silindi."}
    except Exception as e:
        raise Exception(f"Silme sırasında hata: {str(e)}")


def get_social_stats_service(platform: Optional[str] = None):
    try:
        query = supabase.table("social_media_posts").select("*")

        if platform:
            query = query.eq("platform", platform)

        response = query.execute()
        posts = response.data or []

        total_likes = sum(p.get("likes", 0) for p in posts)
        total_comments = sum(p.get("comments", 0) for p in posts)
        total_views = sum(p.get("views", 0) for p in posts)

        return {
            "total_posts": len(posts),
            "total_likes": total_likes,
            "total_comments": total_comments,
            "total_views": total_views,
            "posts": posts
        }
    except Exception as e:
        raise Exception(f"İstatistikler getirilirken hata: {str(e)}")