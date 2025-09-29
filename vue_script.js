

let app = Vue.createApp({
    data: function(){
        return {
            app: 'Pixel AI',
            messages: [],
            isRecording: false,
            recognition: null,
            replyingToMessage: null,
            audioContext: null,
            analyser: null,
            animationFrameId: null,
            audioStream: null,
            isNavClosed: true,
            importedFile: null,
        }
    },
        
    mounted() {
        // Load messages from localStorage on page load
        const savedMessages = localStorage.getItem("chatMessages");
        if (savedMessages) {
            this.messages = JSON.parse(savedMessages);
        }
    },

    created() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;

            this.recognition.onstart = () => {
                this.isRecording = true;
            };

            this.recognition.onend = () => {
                this.isRecording = false;
                this.stopVisualization();
            };

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                const textarea = this.$refs.searchInput;
                textarea.value = finalTranscript + interimTranscript;
                this.autoResize(textarea);
            };

            this.recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                this.isRecording = false;
                this.stopVisualization();
            };
        }
    },

    watch: {
        messages: {
            deep: true,
            handler(newMessages) {
                localStorage.setItem("chatMessages", JSON.stringify(newMessages));
            }
        }
    },
    methods: {
        clearChat() {
            this.messages = [];
            localStorage.removeItem("chatMessages");
        },
  
        getKey(event) {
            const textarea = event.target;
            this.autoResize(textarea);

            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                const messageText = textarea.value.trim();
                if (messageText || this.importedFile) {
                    const newMessage = {
                        text: messageText,
                        sender: 'user_search',
                        replyTo: this.replyingToMessage ? { 
                            text: this.replyingToMessage.text, 
                            sender: this.replyingToMessage.sender 
                        } : null,
                        file: this.importedFile,
                    };
                    this.messages.push(newMessage);
                    
                    setTimeout(() => {
                        this.messages.push({
                            text: "This is a placeholder AI response.",
                            sender: "ai_results"
                        });
                    }, 500);

                    textarea.value = "";
                    this.autoResize(textarea);
                    this.cancelReply();
                    this.importedFile = null;
                }
            }
        },

        autoResize(textarea) {
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
        },

        handleFileImport(event) {
            const file = event.target.files[0];
            if (file) {
                this.importedFile = {
                    name: file.name,
                    type: file.type || 'unknown type',
                };
            }
        },

        triggerFileInput() {
            this.$refs.fileInput.click();
        },
        
        async toggleVoiceSearch() {
            if (!this.recognition) {
                console.error("Speech Recognition API not supported.");
                return;
            }

            if (this.isRecording) {
                this.recognition.stop(); // This will trigger onend, which handles cleanup
            } else {
                try {
                    this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    
                    // Resume context if it's suspended
                    if (this.audioContext.state === 'suspended') {
                        await this.audioContext.resume();
                    }

                    this.analyser = this.audioContext.createAnalyser();
                    this.analyser.fftSize = 256;
                    
                    const source = this.audioContext.createMediaStreamSource(this.audioStream);
                    source.connect(this.analyser);
                    
                    this.recognition.start();
                    this.visualizeAudio();

                } catch (err) {
                    console.error("Error accessing microphone:", err);
                    alert("Could not access the microphone. Please ensure you have given permission.");
                }
            }
        },

        visualizeAudio() {
            const animation = () => {
                if (!this.analyser) return;

                const bufferLength = this.analyser.fftSize;
                const dataArray = new Uint8Array(bufferLength);
                this.analyser.getByteTimeDomainData(dataArray);

                let sumSquares = 0.0;
                for (const amplitude of dataArray) {
                    const normalizedAmplitude = (amplitude / 128.0) - 1.0; // Convert to -1 to 1 range
                    sumSquares += normalizedAmplitude * normalizedAmplitude;
                }
                const rms = Math.sqrt(sumSquares / dataArray.length);
                
                const volume = Math.min(1, rms * 5); // Amplify for visibility
                const scaleY = Math.max(0.1, volume * 2); // Map volume to scale

                const waveElements = document.querySelectorAll('.wave');
                waveElements.forEach(wave => {
                    wave.style.transform = `scaleY(${scaleY})`;
                });

                this.animationFrameId = requestAnimationFrame(animation);
            };
            animation();
        },

        stopVisualization() {
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            if (this.audioStream) {
                this.audioStream.getTracks().forEach(track => track.stop());
                this.audioStream = null;
            }
            if (this.audioContext && this.audioContext.state !== 'closed') {
                this.audioContext.close();
                this.audioContext = null;
            }
            document.querySelectorAll('.wave').forEach(wave => {
                wave.style.transform = 'scaleY(0.1)';
            });
        },

        speakMessage(text) {
            if ('speechSynthesis' in window) {
                // Cancel any ongoing or queued speech
                window.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(text);
                
                // Optional: configure voice, rate, pitch
                // const voices = window.speechSynthesis.getVoices();
                // utterance.voice = voices[0]; // You could add voice selection
                utterance.pitch = 1;
                utterance.rate = 1;
                utterance.volume = 1;

                // Speak the new utterance
                window.speechSynthesis.speak(utterance);
            } else {
                console.error("Speech Synthesis API not supported.");
                alert("Sorry, your browser does not support text-to-speech.");
            }
        },

        replyToMessage(message) {
            this.replyingToMessage = message;
            this.$refs.searchInput.focus();
        },

        cancelReply() {
            this.replyingToMessage = null;
        },

        toggleNav() {
            this.isNavClosed = !this.isNavClosed;
        }
    }
})

app.mount('#app');