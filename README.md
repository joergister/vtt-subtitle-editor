# VTT Subtitle Editor

A web-based tool for editing VTT (WebVTT) subtitle files with synchronized audio playback. Perfect for correcting transcription errors and speaker attributions in interview transcripts.

🌐 **Live App**: https://joergister.github.io/vtt-subtitle-editor/

## Features

- **Synchronized Playback**: Play audio while viewing synchronized subtitles
- **Real-time Editing**: Edit subtitle text, speaker names, and timestamps on the fly
- **Speaker Dropdown**: Select speakers from a dropdown to prevent typos when changing attributions
- **Format Preservation**: Exports maintain exact original formatting for clean git diffs
- **Multi-format Audio**: Supports MP3, M4A, WAV, OGG, AAC, FLAC, Opus, WebM
- **Current Subtitle Highlighting**: Auto-scroll and highlight the currently playing subtitle
- **Jump to Timestamp**: Click any subtitle to jump to that point in the audio

## Use Case

This tool was created as a companion to **[transcribe-KIT](https://github.com/joergister/transcribe-KIT)** for editing automatically generated transcriptions. Machine learning transcription models sometimes make mistakes with:

- **Word accuracy**: Mishearing similar-sounding words
- **Speaker attribution**: Confusing speakers with similar voices
- **Technical terms**: Misinterpreting domain-specific vocabulary

The VTT Subtitle Editor lets you quickly correct these errors while listening to the audio, ensuring accurate transcripts for research interviews, meetings, or podcasts.

## How to Use

1. **Open the Editor**: Visit https://joergister.github.io/vtt-subtitle-editor/
2. **Load Files**:
   - Upload your audio file (M4A, MP3, WAV, etc.)
   - Upload your VTT subtitle file
3. **Play & Edit**:
   - Press play to start the audio
   - The current subtitle will be highlighted automatically
   - Edit text, change speaker, or adjust timestamps as needed
4. **Export**: Click "Export Modified VTT" to download your corrected transcript

## Integration with transcribe-KIT

After correcting your VTT file with this editor, convert it to clean dialogue format:

```bash
transcribe vtt-to-txt corrected_transcript.vtt final_dialogue.txt
```

This produces a readable text file like:
```
INTERVIEWER: Can you describe your experience with the tool?

PARTICIPANT: I found it very intuitive and easy to use. The interface was well-designed.

INTERVIEWER: What features did you find most useful?
```

## Technical Details

- **Pure HTML5 + JavaScript**: No frameworks, no dependencies
- **Client-side Processing**: All editing happens in your browser - no data is uploaded
- **Format Preservation**: Maintains original VTT formatting (spacing, timestamps) for meaningful git diffs
- **Speaker Detection**: Automatically extracts unique speakers from VTT file for dropdown

## Keyboard Shortcuts

- **Space**: Play/Pause audio
- **Arrow Left/Right**: Seek backward/forward (when audio player is focused)

## Browser Compatibility

Works in all modern browsers:
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari

## Related Projects

- **[transcribe-KIT](https://github.com/joergister/transcribe-KIT)**: CLI tool for transcribing audio files using KIT's diarization API

## License

MIT License - feel free to use this tool for your research!

## Feedback

Found a bug or have a feature request? [Open an issue](https://github.com/joergister/vtt-subtitle-editor/issues) on GitHub.
