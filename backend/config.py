from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@db:5432/inventory",
        validation_alias="DATABASE_URL"
    )
    PROJECT_NAME: str = "Inventory & Order Management System"
    ALLOWED_HOSTS: str = "*"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
