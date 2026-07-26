from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from app.database.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    # Original filename
    filename = Column(String, nullable=False)

    # Upload timestamp
    upload_time = Column(DateTime, default=datetime.utcnow)

    # Processing status
    status = Column(String, default="PROCESSING")

    # Total pages in PDF
    total_pages = Column(Integer, default=0)

    # Total chunks generated
    total_chunks = Column(Integer, default=0)