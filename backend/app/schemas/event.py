from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EventUpdateStatus(BaseModel):
    status: str