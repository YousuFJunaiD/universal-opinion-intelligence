# Universal Opinion Intelligence ML Service

FastAPI backend for the Universal Opinion Intelligence Platform.

This service provides the first real NLP baseline for the Next.js app through `FASTAPI_ML_URL`.

## Model Baseline

- Sentiment: `vaderSentiment` lexical NLP baseline.
- Deep analysis: deterministic lexical baseline for emotion, stance, aspects, and risk signals, supported by VADER sentiment polarity.
- Fallback: if `vaderSentiment` cannot be imported, the service falls back to the existing deterministic keyword baseline and labels the model as `rule-based-fallback`.

This is not a transformer model yet. It is a real lightweight NLP baseline that can later be replaced by BERT, RoBERTa, DistilBERT, or Azure Text Analytics without changing the Next.js UI.

## Run Locally

```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

## Endpoints

### `GET /health`

Returns service status and active baseline metadata.

### `POST /analyze/sentiment`

Request:

```json
{
  "records": [
    { "id": "record-1", "text": "The product is excellent and very helpful." },
    { "id": "record-2", "text": "The app is slow and broken." }
  ]
}
```

Response includes:

- `modelName`
- `modelVersion`
- `confidence`
- `summary`
- `records`

Each sentiment record includes:

- `recordId`
- `sentiment`: `positive`, `negative`, or `neutral`
- `confidence`
- `modelName`
- `modelVersion`

### `POST /analyze/deep`

Request:

```json
{
  "records": [
    { "id": "record-1", "text": "I love the support team and recommend the service." },
    { "id": "record-2", "text": "This feels unsafe and the issue is still broken." }
  ]
}
```

Response includes:

- `modelName`
- `modelVersion`
- `confidence`
- `emotionDistribution`
- `stanceDistribution`
- `aspects`
- `riskSignals`
- `records`

Each deep record includes:

- `recordId`
- `emotion`
- `stance`
- `aspects`
- `riskSignals`
- `confidence`
- `modelName`
- `modelVersion`

## Next.js Integration

Run the Next.js app with:

```bash
ANALYSIS_PROVIDER=fastapi FASTAPI_ML_URL=http://127.0.0.1:8000 npm run dev
```

If this service is unavailable, the Next.js app will fall back to the rule-based engine and store fallback metadata in the analysis result.

## Compatibility Aliases

For older adapter tests, these aliases are also available:

- `POST /sentiment`
- `POST /deep-analysis`
