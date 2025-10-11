// VTT Editor - Main JavaScript
class VTTEditor {
    constructor() {
        this.audioElement = document.getElementById('audio-player');
        this.transcriptContainer = document.getElementById('transcript-container');
        this.currentSubtitleText = document.getElementById('current-text');
        this.currentSpeaker = document.getElementById('current-speaker');
        this.currentTimeDisplay = document.getElementById('current-time');
        this.totalTimeDisplay = document.getElementById('total-time');
        this.exportBtn = document.getElementById('export-btn');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.progressBar = document.getElementById('progress-bar');

        this.cues = [];
        this.speakers = new Set();
        this.currentActiveCueIndex = -1;
        this.audioURL = null;
        this.vttFileName = 'modified_transcript.vtt';

        // Scroll to work button
        this.scrollToWorkBtn = document.getElementById('scroll-to-work-btn');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // File upload handlers
        document.getElementById('audio-file').addEventListener('change', (e) => this.handleAudioUpload(e));
        document.getElementById('vtt-file').addEventListener('change', (e) => this.handleVTTUpload(e));

        // Audio playback handlers
        this.audioElement.addEventListener('timeupdate', () => this.handleTimeUpdate());
        this.audioElement.addEventListener('loadedmetadata', () => this.updateTotalTime());
        this.audioElement.addEventListener('play', () => this.handlePlay());
        this.audioElement.addEventListener('pause', () => this.updatePlayPauseButton());

        // Play/Pause button handler
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcut(e));

        // Export handler
        this.exportBtn.addEventListener('click', () => this.exportVTT());

        // Scroll to work button handler
        this.scrollToWorkBtn.addEventListener('click', () => this.scrollToWorkingPosition());

        // Warn before closing/reloading tab
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
    }

    handleAudioUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Revoke previous URL if exists
        if (this.audioURL) {
            URL.revokeObjectURL(this.audioURL);
        }

        this.audioURL = URL.createObjectURL(file);
        this.audioElement.src = this.audioURL;

        document.getElementById('audio-file-name').textContent = file.name;

        this.checkIfReadyToEdit();
    }

    async handleVTTUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.vttFileName = file.name.replace('.vtt', '_modified.vtt');

        const text = await file.text();
        this.parseVTT(text);

        document.getElementById('vtt-file-name').textContent = file.name;

        this.renderTranscript();
        this.checkIfReadyToEdit();
    }

    parseVTT(vttText) {
        this.cues = [];
        const lines = vttText.split('\n');
        let i = 0;

        // Skip WEBVTT header and any metadata
        while (i < lines.length && !lines[i].includes('-->')) {
            i++;
        }

        // Parse cues
        while (i < lines.length) {
            const line = lines[i].trim();

            // Check if this is a timestamp line
            if (line.includes('-->')) {
                const [startTime, endTime] = line.split('-->').map(t => t.trim());
                i++;

                // Collect all text lines until we hit an empty line or end of file
                let cueText = '';
                while (i < lines.length && lines[i].trim() !== '') {
                    cueText += (cueText ? '\n' : '') + lines[i].trim();
                    i++;
                }

                // Parse speaker from <v Speaker> tag
                let speaker = '';
                let text = cueText;
                let hasSpaceAfterSpeaker = false;

                // More precise regex to detect space after speaker tag
                const speakerMatch = cueText.match(/<v\s+([^>]+)>(\s?)(.*)/);
                if (speakerMatch) {
                    speaker = speakerMatch[1].trim();
                    hasSpaceAfterSpeaker = speakerMatch[2] === ' ';
                    text = speakerMatch[3].trim();
                }

                // Track unique speakers
                if (speaker) {
                    this.speakers.add(speaker);
                }

                this.cues.push({
                    startTime: this.parseTimestamp(startTime),
                    endTime: this.parseTimestamp(endTime),
                    speaker: speaker,
                    text: text,
                    hasSpaceAfterSpeaker: hasSpaceAfterSpeaker,
                    originalStartTime: startTime,
                    originalEndTime: endTime,
                    timestampsModified: false
                });
            }

            i++;
        }

        console.log(`Parsed ${this.cues.length} cues from VTT file`);
    }

    parseTimestamp(timestamp) {
        // Parse timestamp in format HH:MM:SS.mmm or MM:SS.mmm
        const parts = timestamp.split(':');
        let hours = 0, minutes = 0, seconds = 0;

        if (parts.length === 3) {
            hours = parseInt(parts[0]);
            minutes = parseInt(parts[1]);
            seconds = parseFloat(parts[2]);
        } else if (parts.length === 2) {
            minutes = parseInt(parts[0]);
            seconds = parseFloat(parts[1]);
        }

        return hours * 3600 + minutes * 60 + seconds;
    }

    formatTimestamp(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);

        const pad = (num, size = 2) => String(num).padStart(size, '0');

        return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(ms, 3)}`;
    }

    renderTranscript() {
        if (this.cues.length === 0) {
            this.transcriptContainer.innerHTML = '<div class="empty-state">No subtitles found in VTT file</div>';
            return;
        }

        this.transcriptContainer.innerHTML = '';

        this.cues.forEach((cue, index) => {
            const cueElement = this.createCueElement(cue, index);
            this.transcriptContainer.appendChild(cueElement);
        });
    }

    createCueElement(cue, index) {
        const cueDiv = document.createElement('div');
        cueDiv.className = 'cue-item';
        cueDiv.dataset.index = index;

        // Create speaker dropdown options with keyboard shortcuts
        const speakerOptions = Array.from(this.speakers).sort().map((speaker, idx) =>
            `<option value="${speaker}" ${speaker === cue.speaker ? 'selected' : ''}>${idx + 1}. ${speaker}</option>`
        ).join('');

        cueDiv.innerHTML = `
            <div class="cue-header">
                <div class="cue-time">
                    <span class="time-display">${this.formatTimestamp(cue.startTime)} → ${this.formatTimestamp(cue.endTime)}</span>
                </div>
                <div class="cue-speaker-editor">
                    <label>Speaker:</label>
                    <select class="speaker-select">
                        ${speakerOptions}
                    </select>
                </div>
            </div>
            <div class="cue-text-editor">
                <textarea class="text-input">${cue.text}</textarea>
            </div>
            <div class="cue-actions">
                <div class="time-editor">
                    <input type="text" class="time-input start-time" value="${this.formatTimestamp(cue.startTime)}" placeholder="00:00:00.000">
                    <span>→</span>
                    <input type="text" class="time-input end-time" value="${this.formatTimestamp(cue.endTime)}" placeholder="00:00:05.000">
                </div>
                <button class="btn-secondary" onclick="vttEditor.seekToCue(${index})">Jump to</button>
                <button class="btn-danger" onclick="vttEditor.deleteCue(${index})">Delete</button>
            </div>
        `;

        // Add event listeners for editing
        const speakerSelect = cueDiv.querySelector('.speaker-select');
        const textInput = cueDiv.querySelector('.text-input');
        const startTimeInput = cueDiv.querySelector('.start-time');
        const endTimeInput = cueDiv.querySelector('.end-time');

        speakerSelect.addEventListener('change', (e) => {
            this.cues[index].speaker = e.target.value;
        });

        textInput.addEventListener('input', (e) => {
            this.cues[index].text = e.target.value;
        });

        startTimeInput.addEventListener('change', (e) => {
            const newTime = this.parseTimestamp(e.target.value);
            if (!isNaN(newTime)) {
                this.cues[index].startTime = newTime;
                this.cues[index].timestampsModified = true;
            } else {
                e.target.value = this.formatTimestamp(this.cues[index].startTime);
            }
        });

        endTimeInput.addEventListener('change', (e) => {
            const newTime = this.parseTimestamp(e.target.value);
            if (!isNaN(newTime)) {
                this.cues[index].endTime = newTime;
                this.cues[index].timestampsModified = true;
            } else {
                e.target.value = this.formatTimestamp(this.cues[index].endTime);
            }
        });

        return cueDiv;
    }

    handleTimeUpdate() {
        const currentTime = this.audioElement.currentTime;

        // Update time display
        this.currentTimeDisplay.textContent = this.formatTimestamp(currentTime);

        // Update progress bar
        if (this.audioElement.duration) {
            const progress = (currentTime / this.audioElement.duration) * 100;
            this.progressBar.style.width = `${progress}%`;
        }

        // Find active cue
        const activeCueIndex = this.cues.findIndex(cue =>
            currentTime >= cue.startTime && currentTime < cue.endTime
        );

        if (activeCueIndex !== this.currentActiveCueIndex) {
            this.updateActiveCue(activeCueIndex);
        }
    }

    updateActiveCue(newIndex) {
        // Remove highlight from previous cue
        if (this.currentActiveCueIndex >= 0) {
            const prevCueElement = this.transcriptContainer.querySelector(`[data-index="${this.currentActiveCueIndex}"]`);
            if (prevCueElement) {
                prevCueElement.classList.remove('active');
            }
        }

        this.currentActiveCueIndex = newIndex;

        if (newIndex >= 0) {
            const cue = this.cues[newIndex];

            // Update current subtitle display
            this.currentSpeaker.textContent = cue.speaker || 'Unknown';
            this.currentSubtitleText.textContent = cue.text;

            // Highlight current cue in transcript
            const cueElement = this.transcriptContainer.querySelector(`[data-index="${newIndex}"]`);
            if (cueElement) {
                cueElement.classList.add('active');

                // Scroll to active cue within the transcript container only
                const containerTop = this.transcriptContainer.scrollTop;
                const containerHeight = this.transcriptContainer.clientHeight;
                const elementTop = cueElement.offsetTop - this.transcriptContainer.offsetTop;
                const elementHeight = cueElement.offsetHeight;

                // Center the element in the container
                const scrollTo = elementTop - (containerHeight / 2) + (elementHeight / 2);

                this.transcriptContainer.scrollTo({
                    top: scrollTo,
                    behavior: 'smooth'
                });
            }
        } else {
            // No active cue
            this.currentSpeaker.textContent = '';
            this.currentSubtitleText.textContent = 'No subtitle at current time';
        }
    }

    updateTotalTime() {
        this.totalTimeDisplay.textContent = this.formatTimestamp(this.audioElement.duration);
    }

    togglePlayPause() {
        if (this.audioElement.paused) {
            this.audioElement.play();
        } else {
            this.audioElement.pause();
        }
    }

    handlePlay() {
        this.updatePlayPauseButton();

        // Every time play is pressed, scroll to working position
        this.scrollToWorkingPosition();
    }

    updatePlayPauseButton() {
        const playIcon = this.playPauseBtn.querySelector('.play-icon');
        const pauseIcon = this.playPauseBtn.querySelector('.pause-icon');

        if (this.audioElement.paused) {
            playIcon.style.display = 'inline';
            pauseIcon.style.display = 'none';
        } else {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'inline';
        }
    }

    seekToCue(index) {
        if (index >= 0 && index < this.cues.length) {
            this.audioElement.currentTime = this.cues[index].startTime;
            this.audioElement.play();
        }
    }

    deleteCue(index) {
        if (confirm('Are you sure you want to delete this cue?')) {
            this.cues.splice(index, 1);
            this.renderTranscript();

            // Update current cue if necessary
            if (this.currentActiveCueIndex === index) {
                this.currentActiveCueIndex = -1;
                this.updateActiveCue(-1);
            } else if (this.currentActiveCueIndex > index) {
                this.currentActiveCueIndex--;
            }
        }
    }

    handleKeyboardShortcut(event) {
        // Check if user is typing in an input field
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.tagName === 'SELECT'
        );

        // If typing in a field, don't handle shortcuts
        if (isTyping) {
            return;
        }

        // Number keys 1-9 for speaker shortcuts
        if (event.key >= '1' && event.key <= '9') {
            const speakerIndex = parseInt(event.key) - 1;
            this.changeSpeakerByIndex(speakerIndex);
            event.preventDefault();
        }
    }

    changeSpeakerByIndex(speakerIndex) {
        // Only change speaker if there's an active cue
        if (this.currentActiveCueIndex === -1) {
            return;
        }

        // Get sorted list of speakers
        const speakersList = Array.from(this.speakers).sort();

        // Check if the speaker index is valid
        if (speakerIndex >= speakersList.length) {
            return;
        }

        const newSpeaker = speakersList[speakerIndex];
        const cueIndex = this.currentActiveCueIndex;

        // Update the cue's speaker
        this.cues[cueIndex].speaker = newSpeaker;

        // Update the current subtitle display
        this.currentSpeaker.textContent = newSpeaker;

        // Update the dropdown in the transcript
        const cueElement = this.transcriptContainer.querySelector(`[data-index="${cueIndex}"]`);
        if (cueElement) {
            const speakerSelect = cueElement.querySelector('.speaker-select');
            if (speakerSelect) {
                speakerSelect.value = newSpeaker;
            }
        }

        console.log(`Changed speaker to: ${newSpeaker} (shortcut ${speakerIndex + 1})`);
    }

    checkIfReadyToEdit() {
        if (this.audioElement.src && this.cues.length > 0) {
            this.exportBtn.disabled = false;

            // Show scroll to work button when both files are loaded
            this.scrollToWorkBtn.style.display = 'block';
        }
    }

    scrollToWorkingPosition() {
        // Always scroll to "Currently Playing" at the top
        const currentCueDisplay = document.querySelector('.current-cue-display');

        if (currentCueDisplay) {
            const rect = currentCueDisplay.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const targetPosition = rect.top + scrollTop - 20; // 20px from top

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    handleBeforeUnload(event) {
        // Show warning if cues have been loaded (work in progress)
        if (this.cues.length > 0) {
            event.preventDefault();
            event.returnValue = ''; // Required for Chrome
        }
    }

    exportVTT() {
        let vttContent = 'WEBVTT\n\n';

        this.cues.forEach((cue, index) => {
            // Use original timestamps if not modified, otherwise format the new ones
            const startTime = cue.timestampsModified
                ? this.formatTimestamp(cue.startTime)
                : cue.originalStartTime;
            const endTime = cue.timestampsModified
                ? this.formatTimestamp(cue.endTime)
                : cue.originalEndTime;

            vttContent += `${startTime} --> ${endTime}\n`;

            if (cue.speaker) {
                const spacer = cue.hasSpaceAfterSpeaker ? ' ' : '';
                vttContent += `<v ${cue.speaker}>${spacer}${cue.text}\n`;
            } else {
                vttContent += `${cue.text}\n`;
            }

            vttContent += '\n';
        });

        // Create download
        const blob = new Blob([vttContent], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.vttFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('VTT file exported successfully');
    }
}

// Initialize the editor when DOM is ready
let vttEditor;
document.addEventListener('DOMContentLoaded', () => {
    vttEditor = new VTTEditor();
    console.log('VTT Editor initialized');
});
