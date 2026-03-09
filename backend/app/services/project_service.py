from fastapi import HTTPException, status
from typing import List
from app.core.supabase_client import get_supabase
from app.schemas.project import ProjectCreate, ProjectTaskCreate
from app.schemas.user import User

supabase = get_supabase()

def create_project(data: ProjectCreate, current_user: User):
    # data.manager_ids listesini kullanıyoruz (Frontend'den array gelmeli)
    managers = data.manager_ids if data.manager_ids else [str(current_user.id)]
    
    insert_data = {
        "name": data.name,
        "description": data.description,
        "manager_ids": managers  # Veritabanına liste olarak kaydediyoruz
    }
    
    response = supabase.table("projects").insert(insert_data).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Proje oluşturulamadı")
    return response.data[0]

def get_all_projects():
    projects_res = supabase.table("projects").select("*").execute()
    projects_data = projects_res.data or []
    
    # Üyeleri ve üyelerin profil bilgilerini JOIN ile çekiyoruz
    members_res = supabase.table("project_members").select("*, profiles(first_name, last_name)").execute()
    
    
    tasks_res = supabase.table("project_tasks").select("*").execute()
    
    result = []
    for p in projects_data:
        p_id = p.get("id")
        
        # --- Üyeler Listesi (Members) ---
        p_members = []
        for m in (members_res.data or []):
            if m.get("project_id") == p_id:
                prof = m.get("profiles") or {}
                m_name = f"{prof.get('first_name') or ''} {prof.get('last_name') or ''}".strip()
                
                p_members.append({
                    "id": m.get("user_id"), 
                    "name": m_name if m_name else "Bilinmiyor", 
                    "role": m.get("role")
                })
        
        # --- Görevler Listesi (Tasks) ---
        p_tasks = []
        for t in (tasks_res.data or []):
            if t.get("project_id") == p_id:
                p_tasks.append({
                    "id": t.get("id"),
                    "title": t.get("title"),
                    "status": t.get("status"),
                    "assigneeId": t.get("assignee_id"),
                    "createdAt": t.get("created_at")
                })
                
        # --- Proje Yöneticisi (Manager) İsim Çözümleme ---
        m_ids = p.get("manager_ids") or []
        
        # Sonucu Listemize Ekliyoruz
        result.append({
            "id": p_id,
            "name": p.get("name"),
            "description": p.get("description"),
            "managers": m_ids, 
            "members": p_members,
            "tasks": p_tasks,
        })
        
    return result    


def delete_project(project_id: str):
    response = supabase.table("projects").delete().eq("id", project_id).execute()
    return response.data

def add_member(project_id: str, user_id: str, role: str):
    insert_data = {
        "project_id": project_id,
        "user_id": user_id,
        "role": role
    }
    # Handling unique constraint is done by supabase
    response = supabase.table("project_members").insert(insert_data).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Üye eklenemedi")
    return response.data[0]

def remove_member(project_id: str, user_id: str):
    response = supabase.table("project_members").delete().eq("project_id", project_id).eq("user_id", user_id).execute()
    return response.data

def add_task(project_id: str, data: ProjectTaskCreate):
    insert_data = {
        "project_id": project_id,
        "title": data.title,
        "status": data.status or "Yapılacak",
        "assignee_id": str(data.assigneeId) if data.assigneeId else None
    }
    response = supabase.table("project_tasks").insert(insert_data).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Görev eklenemedi")
    return response.data[0]

def delete_task(task_id: str):
    response = supabase.table("project_tasks").delete().eq("id", task_id).execute()
    return response.data

def update_task_status(task_id: str, status: str):
    response = supabase.table("project_tasks").update({"status": status}).eq("id", task_id).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Görev güncellenemedi")
    return response.data[0]
