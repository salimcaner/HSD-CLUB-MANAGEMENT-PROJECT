from pydantic import BaseModel
from typing import Literal

class ReportStatusUpdate(BaseModel):
    status: Literal["Approved", "Rejected"]