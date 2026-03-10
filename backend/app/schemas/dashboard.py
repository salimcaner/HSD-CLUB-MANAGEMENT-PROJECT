from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class DashboardStatsResponse(BaseModel):
    meeting_count: int      
    academy_count: int      
    total_events: int      
    total_members: int      


class CommitteeStatsResponse(BaseModel):
    labels: list[str]  
    counts: list[int]  


class ActivityItem(BaseModel):
    id: str                
    type: str              
    title: str              
    desc: str               
    created_at: datetime    
    iconClass: str          
class DashboardActivitiesResponse(BaseModel):
    activities: list[ActivityItem]

class CountdownResponse(BaseModel):
    success: bool
    title: Optional[str] = None
    event_date: Optional[str] = None
    message: Optional[str] = None