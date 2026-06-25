from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openrouter_api_key: str = ""

    investigador_model: str = "nousresearch/hermes-3-llama-3.1-405b"
    redactor_model: str = "openai/gpt-4o-mini"
    juez_model: str = "openai/gpt-4o"

    hermes_enabled: bool = True
    hermes_url: str = "http://hermes:8765"

    fallback_message: str = (
        "Estamos verificando la información para brindarte una respuesta precisa. "
        "Un asesor continuará tu atención en unos minutos."
    )

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
