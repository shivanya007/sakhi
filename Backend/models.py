from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
from datetime import datetime

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    incident_type = Column(String, nullable=False)
    description = Column(String)
    time_of_incident = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)