from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Use PostgreSQL as the default database, targeting the report schema
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# Create engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Violation(Base):
    __tablename__ = "violations"
    __table_args__ = {'schema': 'report'}

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, index=True)
    exam_id = Column(String, index=True)
    violation_type = Column(String)  # 'multiple_faces', 'looking_away', 'device_detected', etc.
    confidence = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(String)  # Additional details about the violation

# Do not create tables in production PostgreSQL
# Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 