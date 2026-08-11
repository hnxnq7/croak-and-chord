# Animal Crossing Cover Lab

Turn a song the listener has rights to use into a playful, game-inspired instrumental cover. The output is an original arrangement recipe and rendered audio/MIDI—not a sample-for-sample recreation of Nintendo recordings.

## Product idea

Start from MIDI and/or a chord chart, select a **flavor**, review a compact editable arrangement, then play and share a rendered instrumental cover in the browser. The creative target is the broader cozy, toy-instrument, village-daytime feeling associated with Animal Crossing rather than one fixed game's soundtrack.

## Flavor controls

| Control | Examples | What it changes |
| --- | --- | --- |
| Setting | sunny plaza, rainy evening, seaside, winter market | tempo, density, reverb, brightness |
| Era | GameCube-ish, City Folk-ish, New Leaf-ish, New Horizons-ish | instrument palette and mix character |
| Energy | sleepy, strolling, bouncy, festival | groove, percussion, register, transitions |
| Ensemble | music box, toy band, marimba lounge, breezy woodwinds | lead/accompaniment/bass voicings |
| Faithfulness | recognizable, playful rewrite | how strictly melody, chords, and form are retained |

## What users provide

**First release required:** MIDI and/or a chord chart. The app can accept optional reference audio, but it does not depend on transcribing a full mix.

**Helpful, optional:** MIDI, chord chart, tempo/key, official or user-made instrumental/stems, and timestamps for key sections. Lyrics alone do not reliably identify pitch or rhythm; they are useful as a lyric-to-phrase guide when making a vocal melody playable by an instrument.

The app should ask the uploader to confirm that they own the audio or have permission to transform it. Avoid hosting uploads or distributing derivative covers by default; process privately and retain files only as long as needed.

## First MVP

1. Import MIDI and/or enter a chord chart, then choose a flavor preset.
2. Build a song chart and show it in an editable piano-roll + chord timeline.
3. Arrange to a small toy-instrument palette and render a browser-playable preview.
4. Share/export WAV or MP3 and the arrangement JSON.
5. Add assisted full-mix transcription in a later release.

See [the product and technical design](docs/design.md) for the pipeline, data model, and milestones.

## Suggested stack

- **Frontend:** React + TypeScript, browser audio transport, piano-roll editor, and shareable player.
- **API/workers:** Python (FastAPI + a job queue) for audio/ML work and deterministic arrangement.
- **Audio/MIDI:** librosa or Essentia for analysis, a source-separation worker when needed, PrettyMIDI/mido for MIDI, and a SoundFont or licensed instrument library for rendering.
- **Storage:** object storage for short-lived source/preview files; PostgreSQL for projects and edits.

## Repository layout

```
docs/                product and technical decisions
src/ac_cover_lab/    domain models and arrangement engine (initially)
web/                 dependency-free first interactive prototype
```

## Run the prototype

```sh
npm start
```

Open `http://localhost:4173`. It includes a cozy demo, MIDI import, four arrangement flavors, live browser playback, and WAV download.

The in-browser synthesizer is fully original — no game samples. It builds a small warm "room" (a generated convolution reverb) and plays a handful of synthesized instruments: an inharmonic **bell** lead, a woody **kalimba/marimba** chord comp, a softened **leafy guitar** swell, a round **upright bass**, and filtered-noise **shaker/hand percussion**, plus the opt-in **croak-chat** vocal voice. Harmony is generated, not copied: the arranger estimates the song's key from the imported notes and voices a diatonic chord loop (I–V–vi–IV) underneath the melody, so the accompaniment follows whatever MIDI you bring.

Each **flavor** now picks its own instruments and room: Sunny dock rings out on a bright bell in a dry room; Rainy cabin and Lantern tide switch to a soft music box with a longer reverb tail and a warm sustained pad; Saltwater stroll rolls on wooden marimba. The three **song suitcase** cards (Odoriko / vampire / What Is Love?) each load a short *original* melody sketch written to fit that mood — they are not transcriptions of the real songs — so every card plays something different.
