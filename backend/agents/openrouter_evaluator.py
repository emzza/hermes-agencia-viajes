from openai import AsyncOpenAI, OpenAI
from deepeval.models.base_model import DeepEvalBaseLLM


class OpenRouterEvaluator(DeepEvalBaseLLM):
    def __init__(self, model: str, api_key: str):
        self._model = model
        self._api_key = api_key

    def load_model(self) -> OpenAI:
        return OpenAI(
            api_key=self._api_key,
            base_url="https://openrouter.ai/api/v1",
        )

    def generate(self, prompt: str) -> tuple[str, float]:
        client = self.load_model()
        response = client.chat.completions.create(
            model=self._model,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content, 0.0

    async def a_generate(self, prompt: str) -> tuple[str, float]:
        client = AsyncOpenAI(
            api_key=self._api_key,
            base_url="https://openrouter.ai/api/v1",
        )
        response = await client.chat.completions.create(
            model=self._model,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content, 0.0

    def get_model_name(self) -> str:
        return self._model
