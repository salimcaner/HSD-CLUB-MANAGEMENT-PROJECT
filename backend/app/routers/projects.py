from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.core import security
from app.schemas.project import (
    ProjectCreate, 
    ProjectResponse, 
    ProjectMemberCreate, 
    ProjectTaskCreate, 
    ProjectTaskUpdate
)
from app.services import project_service

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("/", response_model=List[ProjectResponse])
async def get_projects(current_user = Depends(security.require_authenticated)):
    """Tüm projeleri, iç içe üyeleri ve görevleriyle getirir."""
    return project_service.get_all_projects()

@router.post("/")
async def create_project(data: ProjectCreate, current_user = Depends(security.require_lider_or_above)):
    """Yeni proje oluştur (Lider ve üstü yetki)."""
    return project_service.create_project(data, current_user)

@router.delete("/{project_id}")
async def delete_project(project_id: str, current_user = Depends(security.require_lider_or_above)):
    """Projeyi sil (Lider ve üstü yetki)."""
    return project_service.delete_project(project_id)

@router.post("/{project_id}/members")
async def add_project_member(project_id: str, data: ProjectMemberCreate, current_user = Depends(security.require_lider_or_above)):
    """Projeye üye ekle (Lider ve üstü yetki)."""
    return project_service.add_member(project_id, str(data.user_id), data.role)

@router.delete("/{project_id}/members/{user_id}")
async def remove_project_member(project_id: str, user_id: str, current_user = Depends(security.require_lider_or_above)):
    """Projeden üye çıkar (Lider ve üstü yetki)."""
    return project_service.remove_member(project_id, user_id)

@router.post("/{project_id}/tasks")
async def add_project_task(project_id: str, data: ProjectTaskCreate, current_user = Depends(security.require_authenticated)):
    """Görev ata (Herkeste izin var, isterseniz lider_or_above yapabilirsiniz)."""
    return project_service.add_task(project_id, data)

@router.delete("/tasks/{task_id}")
async def delete_project_task(task_id: str, current_user = Depends(security.require_authenticated)):
    """Görevi sil."""
    return project_service.delete_task(task_id)

@router.patch("/tasks/{task_id}")
async def update_task_status(task_id: str, data: ProjectTaskUpdate, current_user = Depends(security.require_authenticated)):
    """Görevin statüsünü değiştir (Yetki kontrollü)."""
    return project_service.update_task_status(task_id, data.status, current_user)