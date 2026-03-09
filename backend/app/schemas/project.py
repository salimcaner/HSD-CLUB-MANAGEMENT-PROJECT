from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

# Task Schemas
class ProjectTaskCreate(BaseModel):
    title: str
    status: Optional[str] = "Yapılacak"
    assigneeId: Optional[UUID] = None

    class Config:
        populate_by_name = True

class ProjectTaskUpdate(BaseModel):
    status: str

class ProjectTaskResponse(BaseModel):
    id: str
    title: str
    status: str
    assigneeId: Optional[str] = None
    createdAt: Optional[str] = None

# Member Schemas
class ProjectMemberCreate(BaseModel):
    role: str
    user_id: UUID

class ProjectMemberResponse(BaseModel):
    id: str          
    name: str        
    role: str

# Project Schemas
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    manager_ids: Optional[List[str]] = []

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    managers: List[str] = []
    members: List[ProjectMemberResponse] = []
    tasks: List[ProjectTaskResponse] = []
