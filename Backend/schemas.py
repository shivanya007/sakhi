from pydantic import BaseModel
from datetime import datetime

class ReportCreate(BaseModel):
    latitude: float
    longitude: float
    incident_type: str
    description: str
    time_of_incident: str

class ReportResponse(BaseModel):
    id: int
    latitude: float
    longitude: float
    incident_type: str
    description: str
    time_of_incident: str
    created_at: datetime

    class Config:
        from_attributes = True