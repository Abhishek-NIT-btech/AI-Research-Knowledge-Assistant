from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Research & Knowledge Assistant"
    VERSION: str = "1.0.0"

    UPLOAD_DIR: str = "data/uploads"
    VECTOR_DB_DIR: str = "data/vector_db"

    OPENAI_API_KEY: str

    class Config:
        env_file = ".env"


settings = Settings()