from __future__ import annotations

import re
from collections import Counter
from statistics import mean
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
except Exception:  # pragma: no cover - exercised only when dependency import fails
    SentimentIntensityAnalyzer = None


MODEL_NAME = "vader-lexical-baseline"
MODEL_VERSION = "1.0.0"
DEEP_MODEL_NAME = "vader-lexical-deep-baseline"
DEEP_MODEL_VERSION = "1.0.0"

POSITIVE_KEYWORDS = {
    "good",
    "great",
    "amazing",
    "excellent",
    "love",
    "useful",
    "happy",
    "satisfied",
    "recommend",
    "best",
    "helpful",
}
NEGATIVE_KEYWORDS = {
    "bad",
    "worst",
    "poor",
    "hate",
    "disappointed",
    "useless",
    "angry",
    "problem",
    "issue",
    "slow",
    "scam",
    "broken",
}
EMOTION_KEYWORDS: dict[str, set[str]] = {
    "joy": {"happy", "love", "great", "amazing", "excellent", "delighted", "excited", "best"},
    "anger": {"angry", "hate", "furious", "annoyed", "outrage", "terrible", "worst"},
    "sadness": {"sad", "disappointed", "unhappy", "regret", "hurt", "letdown"},
    "fear": {"fear", "worried", "unsafe", "risk", "danger", "concerned", "scared"},
    "trust": {"trust", "reliable", "honest", "secure", "helpful", "recommend", "satisfied"},
    "surprise": {"surprised", "unexpected", "shocked", "wow", "sudden"},
}
STANCE_KEYWORDS: dict[str, set[str]] = {
    "supportive": {"support", "agree", "recommend", "love", "like", "useful", "helpful"},
    "opposing": {"oppose", "disagree", "hate", "boycott", "reject", "against", "bad", "worst"},
    "questioning": {"why", "how", "what", "when", "question", "confused", "unclear"},
}
RISK_KEYWORDS = {
    "scam",
    "hate",
    "complaint",
    "broken",
    "issue",
    "problem",
    "boycott",
    "unsafe",
    "angry",
    "fraud",
    "lawsuit",
    "danger",
    "risk",
}
STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "for",
    "from",
    "has",
    "have",
    "i",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "our",
    "the",
    "their",
    "this",
    "to",
    "was",
    "with",
    "you",
    "your",
}


class TextRecord(BaseModel):
    id: str = Field(min_length=1)
    text: str = Field(min_length=1)

    @field_validator("id", "text")
    @classmethod
    def must_not_be_blank(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Value must not be blank.")
        return normalized


class AnalysisRequest(BaseModel):
    records: list[TextRecord] = Field(min_length=1)


class SentimentRecordResponse(BaseModel):
    id: str
    recordId: str
    text: str
    sentiment: Literal["positive", "negative", "neutral"]
    confidence: float
    modelName: str
    modelVersion: str
    positiveKeywordMatches: list[str]
    negativeKeywordMatches: list[str]


class SentimentSummary(BaseModel):
    totalAnalysed: int
    positiveCount: int
    negativeCount: int
    neutralCount: int
    positivePercentage: int
    negativePercentage: int
    neutralPercentage: int


class SentimentResponse(BaseModel):
    modelName: str
    modelVersion: str
    confidence: float
    summary: SentimentSummary
    records: list[SentimentRecordResponse]


class AspectResult(BaseModel):
    aspect: str
    count: int
    sampleRecordIds: list[str]


class RiskSignal(BaseModel):
    id: str
    label: str
    severity: Literal["low", "medium", "high"]
    count: int
    matchedKeywords: list[str]
    sampleRecordIds: list[str]


class DeepRecordResponse(BaseModel):
    id: str
    recordId: str
    text: str
    emotion: Literal["joy", "anger", "sadness", "fear", "trust", "surprise", "neutral"]
    stance: Literal["supportive", "opposing", "questioning", "neutral"]
    aspects: list[str]
    riskSignals: list[str]
    confidence: float
    modelName: str
    modelVersion: str


class DeepResponse(BaseModel):
    modelName: str
    modelVersion: str
    confidence: float
    emotionDistribution: dict[str, int]
    stanceDistribution: dict[str, int]
    aspects: list[AspectResult]
    riskSignals: list[RiskSignal]
    records: list[DeepRecordResponse]


app = FastAPI(
    title="Universal Opinion Intelligence ML Service",
    description="FastAPI NLP baseline service for sentiment and deep opinion signals.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:3003",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = SentimentIntensityAnalyzer() if SentimentIntensityAnalyzer else None


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "available",
        "modelName": MODEL_NAME,
        "modelVersion": MODEL_VERSION,
        "sentimentLibrary": "vaderSentiment" if analyzer else "rule-based-fallback",
    }


@app.post("/analyze/sentiment", response_model=SentimentResponse)
def analyze_sentiment(request: AnalysisRequest) -> SentimentResponse:
    records = [score_sentiment(record) for record in request.records]
    return SentimentResponse(
        modelName=MODEL_NAME if analyzer else "rule-based-fallback",
        modelVersion=MODEL_VERSION,
        confidence=round(mean([record.confidence for record in records]) if records else 0, 3),
        summary=build_sentiment_summary(records),
        records=records,
    )


@app.post("/analyze/deep", response_model=DeepResponse)
def analyze_deep(request: AnalysisRequest) -> DeepResponse:
    aspects = detect_aspects(request.records)
    risk_signals = detect_risk_signals(request.records)
    deep_records = [score_deep_record(record, aspects, risk_signals) for record in request.records]
    emotion_distribution = {label: 0 for label in ["joy", "anger", "sadness", "fear", "trust", "surprise", "neutral"]}
    stance_distribution = {label: 0 for label in ["supportive", "opposing", "questioning", "neutral"]}

    for record in deep_records:
        emotion_distribution[record.emotion] += 1
        stance_distribution[record.stance] += 1

    return DeepResponse(
        modelName=DEEP_MODEL_NAME if analyzer else "rule-based-deep-fallback",
        modelVersion=DEEP_MODEL_VERSION,
        confidence=round(mean([record.confidence for record in deep_records]) if deep_records else 0, 3),
        emotionDistribution=emotion_distribution,
        stanceDistribution=stance_distribution,
        aspects=aspects,
        riskSignals=risk_signals,
        records=deep_records,
    )


@app.post("/sentiment", response_model=SentimentResponse)
def legacy_sentiment_alias(request: AnalysisRequest) -> SentimentResponse:
    return analyze_sentiment(request)


@app.post("/deep-analysis", response_model=DeepResponse)
def legacy_deep_alias(request: AnalysisRequest) -> DeepResponse:
    return analyze_deep(request)


def score_sentiment(record: TextRecord) -> SentimentRecordResponse:
    scores = vader_scores(record.text)
    compound = scores["compound"]
    sentiment = label_sentiment(compound)
    positive_matches = keyword_matches(record.text, POSITIVE_KEYWORDS)
    negative_matches = keyword_matches(record.text, NEGATIVE_KEYWORDS)

    return SentimentRecordResponse(
        id=f"sentiment-{record.id}",
        recordId=record.id,
        text=record.text,
        sentiment=sentiment,
        confidence=confidence_from_compound(compound, positive_matches, negative_matches),
        modelName=MODEL_NAME if analyzer else "rule-based-fallback",
        modelVersion=MODEL_VERSION,
        positiveKeywordMatches=positive_matches,
        negativeKeywordMatches=negative_matches,
    )


def score_deep_record(record: TextRecord, aspects: list[AspectResult], risks: list[RiskSignal]) -> DeepRecordResponse:
    scores = vader_scores(record.text)
    tokens = tokenize(record.text)
    matched_aspects = [aspect.aspect for aspect in aspects if aspect.aspect in tokens][:5]
    matched_risks = [risk.label for risk in risks if set(risk.matchedKeywords).intersection(tokens)]

    return DeepRecordResponse(
        id=f"deep-{record.id}",
        recordId=record.id,
        text=record.text,
        emotion=detect_emotion(tokens, scores["compound"]),
        stance=detect_stance(tokens, scores["compound"]),
        aspects=matched_aspects,
        riskSignals=matched_risks,
        confidence=confidence_from_compound(scores["compound"], [], matched_risks),
        modelName=DEEP_MODEL_NAME if analyzer else "rule-based-deep-fallback",
        modelVersion=DEEP_MODEL_VERSION,
    )


def vader_scores(text: str) -> dict[str, float]:
    if analyzer:
        return analyzer.polarity_scores(text)

    tokens = tokenize(text)
    positive = len(POSITIVE_KEYWORDS.intersection(tokens))
    negative = len(NEGATIVE_KEYWORDS.intersection(tokens))
    total = max(positive + negative, 1)
    compound = (positive - negative) / total
    return {"compound": compound, "pos": positive / total, "neg": negative / total, "neu": 0.0}


def label_sentiment(compound: float) -> Literal["positive", "negative", "neutral"]:
    if compound >= 0.05:
        return "positive"
    if compound <= -0.05:
        return "negative"
    return "neutral"


def confidence_from_compound(compound: float, positive_matches: list[str], negative_matches: list[str]) -> float:
    lexical_boost = min((len(positive_matches) + len(negative_matches)) * 0.04, 0.16)
    return round(min(0.55 + abs(compound) * 0.35 + lexical_boost, 0.98), 3)


def build_sentiment_summary(records: list[SentimentRecordResponse]) -> SentimentSummary:
    total = len(records)
    positive = sum(1 for record in records if record.sentiment == "positive")
    negative = sum(1 for record in records if record.sentiment == "negative")
    neutral = total - positive - negative

    return SentimentSummary(
        totalAnalysed=total,
        positiveCount=positive,
        negativeCount=negative,
        neutralCount=neutral,
        positivePercentage=percentage(positive, total),
        negativePercentage=percentage(negative, total),
        neutralPercentage=percentage(neutral, total),
    )


def detect_aspects(records: list[TextRecord]) -> list[AspectResult]:
    aspect_counter: Counter[str] = Counter()
    samples: dict[str, list[str]] = {}

    for record in records:
        for token in tokenize(record.text):
            if token in STOPWORDS or token in POSITIVE_KEYWORDS or token in NEGATIVE_KEYWORDS or len(token) < 4:
                continue
            aspect_counter[token] += 1
            samples.setdefault(token, [])
            if len(samples[token]) < 3:
                samples[token].append(record.id)

    return [
        AspectResult(aspect=aspect, count=count, sampleRecordIds=samples[aspect])
        for aspect, count in aspect_counter.most_common(10)
        if count >= 2
    ]


def detect_risk_signals(records: list[TextRecord]) -> list[RiskSignal]:
    risk_counter: Counter[str] = Counter()
    samples: dict[str, list[str]] = {}

    for record in records:
        tokens = tokenize(record.text)
        for keyword in sorted(RISK_KEYWORDS.intersection(tokens)):
            risk_counter[keyword] += 1
            samples.setdefault(keyword, [])
            if len(samples[keyword]) < 3:
                samples[keyword].append(record.id)

    return [
        RiskSignal(
            id=f"risk-{keyword}",
            label=keyword,
            severity=risk_severity(count),
            count=count,
            matchedKeywords=[keyword],
            sampleRecordIds=samples[keyword],
        )
        for keyword, count in risk_counter.most_common(10)
    ]


def detect_emotion(tokens: set[str], compound: float) -> Literal["joy", "anger", "sadness", "fear", "trust", "surprise", "neutral"]:
    scores = {emotion: len(keywords.intersection(tokens)) for emotion, keywords in EMOTION_KEYWORDS.items()}
    emotion, score = max(scores.items(), key=lambda item: item[1])
    if score > 0:
        return emotion  # type: ignore[return-value]
    if compound >= 0.35:
        return "joy"
    if compound <= -0.35:
        return "anger"
    return "neutral"


def detect_stance(tokens: set[str], compound: float) -> Literal["supportive", "opposing", "questioning", "neutral"]:
    scores = {stance: len(keywords.intersection(tokens)) for stance, keywords in STANCE_KEYWORDS.items()}
    stance, score = max(scores.items(), key=lambda item: item[1])
    if score > 0:
        return stance  # type: ignore[return-value]
    if compound >= 0.35:
        return "supportive"
    if compound <= -0.35:
        return "opposing"
    return "neutral"


def risk_severity(count: int) -> Literal["low", "medium", "high"]:
    if count >= 5:
        return "high"
    if count >= 2:
        return "medium"
    return "low"


def keyword_matches(text: str, keywords: set[str]) -> list[str]:
    tokens = tokenize(text)
    return sorted(keywords.intersection(tokens))


def tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z][a-zA-Z'-]*", text.lower()))


def percentage(value: int, total: int) -> int:
    if total == 0:
        return 0
    return round((value / total) * 100)
