from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db
import models
import schemas
from models import Report
from safe_route import find_safe_route

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Women Safety Backend API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Women Safety Backend Running"}

# ✅ Add Report
@app.post("/report", response_model=schemas.ReportResponse)
def create_report(report: schemas.ReportCreate, db: Session = Depends(get_db)):
    new_report = Report(**report.dict())
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

# ✅ Get Heatmap Data
@app.get("/heatmap")
def get_heatmap(db: Session = Depends(get_db)):
    reports = db.query(Report).all()
    return reports

# ✅ Safe Route
@app.get("/safe-route")
def safe_route(start_lat: float, start_lng: float,
               end_lat: float, end_lng: float,
               db: Session = Depends(get_db)):
    
    reports = db.query(Report).all()
    
    route = find_safe_route(start_lat, start_lng, end_lat, end_lng, reports)
    
    return route    