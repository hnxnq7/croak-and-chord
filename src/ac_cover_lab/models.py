"""Stable musical data models, independent of audio-analysis providers."""

from dataclasses import dataclass, field
from enum import Enum


class Provenance(str, Enum):
    AUTOMATIC = "automatic"
    USER_EDIT = "user_edit"
    USER_MIDI = "user_midi"


@dataclass(frozen=True)
class MusicalFact:
    """An extracted or user-confirmed musical fact with reviewable confidence."""

    provenance: Provenance
    confidence: float


@dataclass(frozen=True)
class Flavor:
    setting: str = "sunny_plaza"
    era: str = "island_pop"
    energy: float = 0.55
    ensemble: str = "toy_band"
    faithfulness: float = 0.8


@dataclass
class SongChart:
    tempo_bpm: float
    key: str
    melody_notes: list[dict] = field(default_factory=list)
    chords: list[dict] = field(default_factory=list)
