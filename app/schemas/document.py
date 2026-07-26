from datetime import datetime
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    filename: str
    upload_time: datetime
    total_pages: int
    total_chunks: int
    status: str

    class Config:
        from_attributes = True