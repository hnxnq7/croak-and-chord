# Animal Crossing Cover Lab

Turn a song the listener has rights to use into a playful, game-inspired instrumental cover. The output is an original arrangement recipe and rendered audio/MIDI—not a sample-for-sample recreation of Nintendo recordings.

## Product idea

Upload an audio file, select a **flavor**, review a compact editable arrangement, then export a MIDI file and a rendered cover. The creative target is the broader cozy, toy-instrument, village-daytime feeling associated with Animal Crossing rather than one fixed game's soundtrack.

## Flavor controls

| Control | Examples | What it changes |
| --- | --- | --- |
| Setting | sunny plaza, rainy evening, seaside, winter market | tempo, density, reverb, brightness |
| Era | GameCube-ish, City Folk-ish, New Leaf-ish, New Horizons-ish | instrument palette and mix character |
| Energy | sleepy, strolling, bouncy, festival | groove, percussion, register, transitions |
| Ensemble | music box, toy band, marimba lounge, breezy woodwinds | lead/accompaniment/bass voicings |
| Faithfulness | recognizable, playful rewrite | how strictly melody, chords, and form are retained |

## What users provide

**Required:** a WAV, MP3, or M4A. WAV/FLAC is preferred. Stereo, clean files work best.

**Helpful, optional:** MIDI, chord chart, tempo/key, official or user-made instrumental/stems, and timestamps for key sections. Lyrics alone do not reliably identify pitch or rhythm; they are useful as a lyric-to-phrase guide when making a vocal melody playable by an instrument.

The app should ask the uploader to confirm that they own the audio or have permission to transform it. Avoid hosting uploads or distributing derivative covers by default; process privately and retain files only as long as needed.

## First MVP

1. Upload audio and choose a flavor preset.
2. Detect tempo/downbeats, key candidates, sections, chord candidates, and a lead-melody candidate.
3. Show an editable piano-roll + chord timeline; manual correction is a core feature, not a fallback failure.
4. Arrange to a small toy-instrument palette and render a preview.
5. Export MIDI, WAV, and the arrangement JSON.

See [the product and technical design](docs/design.md) for the pipeline, data model, and milestones.

## Suggested stack

- **Frontend:** React + TypeScript, waveform/transport, piano-roll editor.
- **API/workers:** Python (FastAPI + a job queue) for audio/ML work and deterministic arrangement.
- **Audio/MIDI:** librosa or Essentia for analysis, a source-separation worker when needed, PrettyMIDI/mido for MIDI, and a SoundFont or licensed instrument library for rendering.
- **Storage:** object storage for short-lived source/preview files; PostgreSQL for projects and edits.

## Repository layout

```
docs/                product and technical decisions
src/ac_cover_lab/    domain models and arrangement engine (initially)
```
