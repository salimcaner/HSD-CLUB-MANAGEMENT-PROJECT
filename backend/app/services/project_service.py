from fastapi import HTTPException, status
from typing import List
from app.core.supabase_client import get_supabase
from app.schemas.project import ProjectCreate, ProjectTaskCreate
from app.schemas.user import User

supabase = get_supabase()

def create_project(data: ProjectCreate, current_user: User):
    # Insert
    insert_data = {
        "name": data.name,
        "description": data.description,
        "manager_id": str(data.manager_id) if data.manager_id else None
    }
    
    response = supabase.table("projects").insert(insert_data).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Proje oluşturulamadı")
    return response.data[0]

def get_all_projects():
    # Fetch projects
    projects_res = supabase.table("projects").select("*").execute()
    projects_data = projects_res.data or []
    
    # Fetch members and tasks for nesting
    members_res = supabase.table("project_members").select("*, profiles(first_name, last_name)").execute()
    tasks_res = supabase.table("project_tasks").select("*").execute()
    
    # Fetch all profiles just to map manager names and task assignee names easily
    profiles_res = supabase.table("profiles").select("id, first_name, last_name").execute()
    profiles_dict = {p["id"]: f"{p.get('first_name') or ''} {p.get('last_name') or ''}".strip() for p in (profiles_res.data or [])}

    result = []
    for p in projects_data:
        p_id = p["id"]
        
        # Members list
        p_members = [
            {
                "id": m["user_id"], 
                "name": profiles_dict.get(m["user_id"], "Bilinmiyor"), 
                "role": m["role"]
            } 
            for m in (members_res.data or []) if m["project_id"] == p_id
        ]
        
        # Tasks list
        p_tasks = [
            {
                "id": t["id"],
                "title": t["title"],
                "status": t["status"],
                "assigneeId": t["assignee_id"],
                "createdAt": t["created_at"]
            }
            for t in (tasks_res.data or []) if t["project_id"] == p_id
        ]

        manager_name = profiles_dict.get(p.get("manager_id"), "Bilinmiyor")

        result.append({
            "id": p_id,
            "name": p["name"],
            "description": p.get("description"),
            "manager": manager_name,
            "managerId": p.get("manager_id"),
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
