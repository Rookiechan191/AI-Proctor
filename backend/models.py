from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Create database URL for SQLite
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./ai_proctor.db')

# Create engine and session
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, index=True)
    exam_id = Column(String, index=True)
    violation_type = Column(String)  # 'multiple_faces', 'looking_away', 'device_detected', etc.
    confidence = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(String)  # Additional details about the violation

# Create all tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 