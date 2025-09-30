// 1. Define the main Chat Component
const ChatComponent = {
    template: `
        <div class="app_container" :class="{ 'nav_closed': isNavClosed }">
            
            <div class="open_icon" @click="toggleNav"><i class="fas fa-bars"></i></div>
            <div class="nav_overlay" @click="toggleNav"></div>

            <div class="nav" :class="{ 'close': isNavClosed }">
                <div class="profile"><img src="img.jpg">
                    <div class="profile_name">
                        <div class="user_firstname">Jace</div>
                        <div class="user_lastname">Morales</div>
                    </div>
                </div>
                <div class="chats">
                    <div class="new_chat" title="New Chat" @click="newChat"><div class="add_icon"><i class="fas fa-plus"></i></div><div class="chat_txt">New Chat</div></div>
                    <div class="chat_history">
                        <router-link v-for="chat in chats" :key="chat.id" :to="'/chat/' + chat.id" class="history_item_wrapper" :class="{ 'active': chat.id === activeChatId }">
                            <span class="history_item">{{ chat.name }}</span>
                            <div class="history_item_actions">
                                <i class="fas fa-ellipsis-h" @click.stop.prevent="toggleChatMenu(chat.id)"></i>
                                <div class="chat_menu" v-if="activeChatMenu === chat.id">
                                    <a href="#" @click.prevent="showModal('editChatName', chat.id)">Edit name</a>
                                    <a href="#" @click.prevent="showModal('clearChat', chat.id)">Clear chat</a>
                                    <a href="#" class="delete" @click.prevent="showModal('deleteChat', chat.id)">Delete chat</a>
                                </div>
                            </div>
                        </router-link>
                    </div>
                </div>
                <div class="nav_footer">
                    <div class="app_info">Powered by <span>Pixel v1 Chat Engine</span></div>
                    <div class="app_version">v1.0.1</div>
                </div>
            </div>
            
            <div class="app_main" :class="{ 'initial-view': messages.length === 0 }">
                <!-- Standard Chat View -->
                <div v-if="messages.length > 0" class="chat_container" ref="chatContainer">
                    <div class="chat_container_content">
                        <template v-for="(turn, turnIndex) in messages" :key="turn.id">
                            <!-- User Message -->
                            <div class="message_bubble user_search">
                                <div class="message_content">
                                    <div v-if="turn.replyTo" class="quoted_reply">
                                        <p>{{ turn.replyTo.text }}</p>
                                    </div>
                                    <div class="message_version_control" v-if="turn.user.history.length > 1">
                                        <i class="fas fa-chevron-left" @click="navigateVersion(turn, -1)"></i>
                                        <span>{{ turn.user.currentVersion + 1 }} / {{ turn.user.history.length }}</span>
                                        <i class="fas fa-chevron-right" @click="navigateVersion(turn, 1)"></i>
                                    </div>
                                    <span class="message_text">{{ turn.user.history[turn.user.currentVersion].text }}</span>
                                    <div class="message_actions">
                                        <i class="fas fa-copy" @click="copyMessage(turn.user.history[turn.user.currentVersion].text)"></i>
                                        <i class="fas fa-pencil-alt" @click="editMessage(turn, turnIndex)"></i>
                                        <i class="fas fa-redo" @click="resendMessage(turn)"></i>
                                    </div>
                                </div>
                            </div>
                            <!-- AI Message -->
                            <div class="message_bubble ai_results" v-if="turn.ai && turn.ai.history.length > 0">
                                <div class="message_content">
                                    <div class="message_version_control" v-if="turn.ai.history.length > 1">
                                        <i class="fas fa-chevron-left" @click="navigateVersion(turn, -1)"></i>
                                        <span>{{ turn.ai.currentVersion + 1 }} / {{ turn.ai.history.length }}</span>
                                        <i class="fas fa-chevron-right" @click="navigateVersion(turn, 1)"></i>
                                    </div>
                                    <span class="message_text">{{ turn.ai.history[turn.ai.currentVersion].text }}</span>
                                    <div class="message_actions">
                                        <i class="fas fa-copy" @click="copyMessage(turn.ai.history[turn.ai.currentVersion].text)"></i>
                                        <i class="fas fa-volume-up speaker-icon" @click="speakMessage(turn.ai.history[turn.ai.currentVersion].text)"></i>
                                        <i class="fas fa-reply reply-icon" @click="replyToMessage(turn)"></i>
                                        <i class="fas fa-sync-alt" @click="regenerateAiResponse(turn)"></i>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                    <div class="dummy"></div>
                </div>

                <!-- Initial Welcome Screen -->
                <div v-else class="initial_ui_container">
                    <div class="prompt_suggestions">
                        <div class="prompt_card" v-for="suggestion in promptSuggestions" @click="sendSuggestion(suggestion.text)">
                            <h4>{{ suggestion.title }}</h4>
                            <p>{{ suggestion.text }}</p>
                        </div>
                    </div>
                </div>

                <div class="intro" :class="{ 'bottom': messages.length > 0, 'center': messages.length === 0 }">
                    <div class="container">
                        <div class="search">
                             <div class="replying_to_bar" v-if="replyingToMessage">
                                <div class="reply_info">
                                    <i class="fas fa-reply"></i>
                                    <p>Replying to: "<span>{{ replyingToMessage.text }}</span>"</p>
                                </div>
                                <i class="fas fa-times cancel_reply" @click="cancelReply"></i>
                            </div>
                            <textarea rows="1" @keyup="getKey" ref="searchInput" name="ai_search" id="search_bar" placeholder="Pixel AI Search..."></textarea>
                             <div class="file_display_container" v-if="importedFiles.length > 0">
                                <div v-for="(file, index) in importedFiles" :key="index" class="file_display_item">
                                    <span class="file_name">{{ file.name }} ({{ file.type }})</span>
                                    <i class="fas fa-times remove_file_icon" @click="removeImportedFile(index)"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="search_utilis">
                            <div class="import_file" @click="triggerFileInput">
                                <i class="fas fa-plus"></i>
                                <input type="file" ref="fileInput" style="display: none;" @change="handleFileImport" multiple>
                            </div>
                            <div class="mic_icon" @click="toggleVoiceSearch">
                                <i class="fas fa-microphone"></i>
                            </div>
                             <div class="recording_animation" :class="{ 'is-visualizing': isVisualizing }" v-show="isRecording">
                                <div class="wave"></div>
                                <div class="wave"></div>
                                <div class="wave"></div>
                            </div>
                            <div class="submit_search" @click="sendMessage">
                               <i class="fas fa-arrow-up"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Reusable Modal Component -->
        <div class="modal_overlay" v-if="isModalVisible" @click="hideModal">
            <div class="modal_content" @click.stop>
                <h3 class="modal_title">{{ modalConfig.title }}</h3>
                <p v-if="modalConfig.message" class="modal_message">{{ modalConfig.message }}</p>
                <div v-if="modalConfig.showInput" class="modal_input_container">
                    <input type="text" v-model="modalInput" class="modal_input" ref="modalInput" @keyup.enter="confirmAction">
                </div>
                <div class="modal_actions">
                    <button class="modal_button cancel" @click="hideModal">{{ modalConfig.cancelText }}</button>
                    <button class="modal_button confirm" :class="modalConfig.confirmClass" @click="confirmAction">{{ modalConfig.confirmText }}</button>
                </div>
            </div>
        </div>

        <!-- Text-to-Speech Animation Overlay -->
        <div class="tts_overlay" v-if="isTtsVisible">
            <div class="tts_close_icon" @click="stopSpeaking">&times;</div>
            <div class="tts_content">
                <div class="tts_text_display">
                    <p v-if="ttsStatus !== 'success'">{{ ttsStatus }}</p>
                    <span v-else v-for="(word, index) in ttsWords" :key="index" :class="{ 'highlight': index === ttsCurrentWordIndex }">
                        {{ word }}&nbsp;
                    </span>
                </div>
                <div class="tts_animation_container">
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            app: 'Pixel AI',
            chats: [],
            activeChatId: null,
            isRecording: false,
            isVisualizing: false,
            recognition: null,
            replyingToMessage: null,
            audioContext: null,
            analyser: null,
            animationFrameId: null,
            audioStream: null,
            isNavClosed: true,
            importedFiles: [],
            editingMessage: null,
            activeChatMenu: null,
            isModalVisible: false,
            modalConfig: {},
            actionToConfirm: null,
            modalInput: '',
            isTtsVisible: false,
            ttsStatus: '',
            ttsWords: [],
            ttsCurrentWordIndex: -1,
            ttsAnimationId: null,
            promptSuggestions: [
                { title: 'Plan a trip', text: 'Plan a 3-day trip to San Francisco' },
                { title: 'Write a poem', text: 'Write a short poem about the rain' },
                { title: 'Explain a concept', text: 'Explain quantum computing in simple terms' },
                { title: 'Draft an email', text: 'Draft an email to my boss about my recent success' },
            ]
        }
    },
    computed: {
        activeChat() {
            return this.chats.find(chat => chat.id === this.activeChatId) || null;
        },
        messages() {
            return this.activeChat ? this.activeChat.messages : [];
        }
    },
    watch: {
        chats: {
            deep: true,
            handler(newChats) {
                localStorage.setItem("pixelAiChats", JSON.stringify(newChats));
            }
        },
        '$route'(to, from) {
            this.activeChatId = to.params.id || null;
        },
        messages: {
            deep: true,
            handler() {
                this.$nextTick(() => {
                    const container = this.$refs.chatContainer;
                    if (container) {
                        container.scrollTop = container.scrollHeight;
                    }
                });
            }
        }
    },
    created() {
        const savedChats = localStorage.getItem("pixelAiChats");
        if (savedChats) {
            this.chats = JSON.parse(savedChats);
        }
        // Set active chat based on route, but don't create a new one automatically
        this.activeChatId = this.$route.params.id || null;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            let sessionFinalTranscript = '';
            this.recognition.onstart = () => {
                this.isRecording = true;
                sessionFinalTranscript = '';
            };
            this.recognition.onend = () => {
                this.isRecording = false;
                this.stopVisualization();
            };
            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        sessionFinalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }
                const textarea = this.$refs.searchInput;
                textarea.value = sessionFinalTranscript + interimTranscript;
                this.autoResize(textarea);
            };
            this.recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                this.isRecording = false;
                this.stopVisualization();
            };
        }
    },
    methods: {
        sendSuggestion(text) {
            const textarea = this.$refs.searchInput;
            textarea.value = text;
            this.getKey({ key: 'Enter', target: textarea, shiftKey: false, preventDefault: () => {} });
        },

        sendMessage() {
            const textarea = this.$refs.searchInput;
            // We only trigger sending if there is text or there are files.
            if (textarea.value.trim() || this.importedFiles.length > 0) {
                this.getKey({ key: 'Enter', target: textarea, shiftKey: false, preventDefault: () => {} });
            }
        },
        
        getKey(event) {
            const textarea = event.target;
            this.autoResize(textarea);

            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                const messageText = textarea.value.trim();

                if (this.editingMessage !== null) {
                    if (messageText && this.activeChat) {
                        const turn = this.activeChat.messages[this.editingMessage.turnIndex];
                        
                        // Add a new version to the user prompt history
                        turn.user.history.push({ text: messageText, files: [] });
                        turn.user.currentVersion = turn.user.history.length - 1;
                        
                        // Remove subsequent turns from the chat
                        this.activeChat.messages.splice(this.editingMessage.turnIndex + 1);

                        // Generate a new AI response for this new prompt version
                        this._generateAiResponseForTurn(turn, true);

                        this.editingMessage = null;
                        textarea.value = "";
                        this.autoResize(textarea);
                    }
                } else {
                    if (messageText || this.importedFiles.length > 0) {
                        let targetChat = this.activeChat;

                        if (!targetChat) {
                            const newId = this.generateUniqueId();
                            const chatName = messageText.substring(0, 40) + (messageText.length > 40 ? '...' : '') || 'New Chat';
                            targetChat = { id: newId, name: chatName, messages: [] };
                            this.chats.push(targetChat);
                            this.$router.push(`/chat/${newId}`);
                        }
                        
                        const newTurn = {
                            id: this.generateUniqueId(),
                            user: {
                                history: [{ text: messageText, files: this.importedFiles }],
                                currentVersion: 0,
                            },
                            ai: {
                                history: [],
                                currentVersion: 0
                            },
                            replyTo: this.replyingToMessage ? {
                                text: this.replyingToMessage.ai.history[this.replyingToMessage.ai.currentVersion].text
                            } : null
                        };
                        
                        if (targetChat.messages.length === 0 && messageText) {
                           targetChat.name = messageText.substring(0, 40) + (messageText.length > 40 ? '...' : '');
                        }
                        
                        targetChat.messages.push(newTurn);
                        this._generateAiResponseForTurn(newTurn);

                        textarea.value = "";
                        this.autoResize(textarea);
                        this.cancelReply();
                        this.importedFiles = [];
                    }
                }
            }
        },
        autoResize(textarea) {
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
        },
        handleFileImport(event) {
            const files = event.target.files;
            if (files) {
                for (const file of files) {
                    this.importedFiles.push({
                        name: file.name,
                        type: this.getFileType(file),
                    });
                }
            }
            event.target.value = '';
        },
        getFileType(file) {
            if (file.type) {
                return file.type;
            }
            const lastDotIndex = file.name.lastIndexOf('.');
            if (lastDotIndex > 0 && lastDotIndex < file.name.length - 1) {
                return file.name.substring(lastDotIndex);
            }
            return file.name;
        },
        removeImportedFile(index) {
            this.importedFiles.splice(index, 1);
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
                this.recognition.stop();
            } else {
                try {
                    this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    if (this.audioContext.state === 'suspended') {
                        await this.audioContext.resume();
                    }
                    this.analyser = this.audioContext.createAnalyser();
                    this.analyser.fftSize = 256;
                    const source = this.audioContext.createMediaStreamSource(this.audioStream);
                    source.connect(this.analyser);
                    this.recognition.start();
                    this.isVisualizing = true;
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
                    const normalizedAmplitude = (amplitude / 128.0) - 1.0;
                    sumSquares += normalizedAmplitude * normalizedAmplitude;
                }
                const rms = Math.sqrt(sumSquares / dataArray.length);
                const volume = Math.min(1, rms * 5);
                const scaleY = Math.max(0.1, volume * 2);

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
            this.isVisualizing = false;
            const waveElements = document.querySelectorAll('.recording_animation .wave');
            waveElements.forEach(wave => {
                wave.style.transform = '';
            });
        },
        speakMessage(text) {
            if (!('speechSynthesis' in window)) {
                this.ttsStatus = 'Sorry, your browser does not support text-to-speech.';
                this.isTtsVisible = true;
                return;
            }
            this.stopSpeaking();
            this.isTtsVisible = true;
            this.ttsStatus = 'Transcribing to audio...';
            this.ttsWords = text.split(/\s+/);
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onstart = () => {
                this.ttsStatus = 'success';
                this.startTtsAnimation();
            };
            utterance.onboundary = (event) => {
                let charIndex = event.charIndex;
                let wordIndex = -1;
                let accumulatedLength = 0;
                for (let i = 0; i < this.ttsWords.length; i++) {
                    accumulatedLength += this.ttsWords[i].length + 1;
                    if (charIndex < accumulatedLength) {
                        wordIndex = i;
                        break;
                    }
                }
                this.ttsCurrentWordIndex = wordIndex;
            };
            utterance.onend = () => {
                this.stopSpeaking();
            };
            utterance.onerror = (event) => {
                this.ttsStatus = `An error occurred: ${event.error}`;
                this.stopTtsAnimation();
            };
            window.speechSynthesis.speak(utterance);
        },
        stopSpeaking() {
            window.speechSynthesis.cancel();
            this.stopTtsAnimation();
            this.isTtsVisible = false;
            this.ttsWords = [];
            this.ttsCurrentWordIndex = -1;
        },
        startTtsAnimation() {
            const ttsWaves = document.querySelectorAll('.tts_animation_container .wave');
            if (!ttsWaves.length) return;
            const animate = () => {
                ttsWaves.forEach(wave => {
                    const randomScale = Math.random() * 0.9 + 0.1;
                    wave.style.transform = `scaleY(${randomScale})`;
                });
                this.ttsAnimationId = requestAnimationFrame(animate);
            };
            animate();
        },
        stopTtsAnimation() {
            if (this.ttsAnimationId) {
                cancelAnimationFrame(this.ttsAnimationId);
                this.ttsAnimationId = null;
            }
             const ttsWaves = document.querySelectorAll('.tts_animation_container .wave');
             if(ttsWaves) {
                ttsWaves.forEach(wave => {
                    wave.style.transform = 'scaleY(0.1)';
                });
             }
        },
        replyToMessage(turn) {
            this.replyingToMessage = turn;
            this.$refs.searchInput.focus();
        },
        cancelReply() {
            this.replyingToMessage = null;
        },
        toggleNav() {
            this.isNavClosed = !this.isNavClosed;
        },
        copyMessage(text) {
            navigator.clipboard.writeText(text).then(() => {}).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        },
        editMessage(turn, turnIndex) {
            this.editingMessage = { turnIndex, ...turn };
            const textarea = this.$refs.searchInput;
            textarea.value = turn.user.history[turn.user.currentVersion].text;
            textarea.focus();
        },
        resendMessage(turn) {
            const currentPrompt = turn.user.history[turn.user.currentVersion];
            const newTurn = {
                id: this.generateUniqueId(),
                user: {
                    history: [{ text: currentPrompt.text, files: currentPrompt.files }],
                    currentVersion: 0,
                },
                ai: {
                    history: [],
                    currentVersion: 0
                }
            };
            this.activeChat.messages.push(newTurn);
            this._generateAiResponseForTurn(newTurn);
        },
        regenerateAiResponse(turn) {
            if (!this.activeChat || !turn) return;

            // Get the current user prompt and add it as a new version
            const currentPrompt = turn.user.history[turn.user.currentVersion];
            turn.user.history.push({ text: currentPrompt.text, files: currentPrompt.files });
            turn.user.currentVersion = turn.user.history.length - 1;

            // Now, generate a new AI response for this new prompt version
            this._generateAiResponseForTurn(turn, true);
        },
        _generateAiResponseForTurn(turn, isRegeneration = false) {
            if (!this.activeChat || !turn) return;

            setTimeout(() => {
                const promptVersion = turn.user.currentVersion + 1;
                const newResponseText = `This is a ${isRegeneration ? 'regenerated ' : ''}response for prompt version ${promptVersion}.`;
                
                turn.ai.history.push({ text: newResponseText });
                turn.ai.currentVersion = turn.ai.history.length - 1;
            }, 500);
        },
        navigateVersion(turn, direction) {
            const newVersion = turn.user.currentVersion + direction;
            if (newVersion >= 0 && newVersion < turn.user.history.length) {
                turn.user.currentVersion = newVersion;
                // AI version should also update to match, if it exists
                if (turn.ai && turn.ai.history[newVersion]) {
                    turn.ai.currentVersion = newVersion;
                }
            }
        },
        toggleChatMenu(chatId) {
            this.activeChatMenu = this.activeChatMenu === chatId ? null : chatId;
        },
        showModal(actionType, payload) {
            this.activeChatMenu = null;
            const chat = this.chats.find(c => c.id === payload);
            const configs = {
                deleteChat: {
                    title: 'Delete Chat',
                    message: 'Are you sure you want to permanently delete this chat?',
                    confirmText: 'Delete',
                    cancelText: 'Cancel',
                    action: () => this.deleteChat(payload),
                    confirmClass: 'delete',
                    showInput: false
                },
                clearChat: {
                    title: 'Clear Chat',
                    message: 'Are you sure you want to clear all messages in this chat?',
                    confirmText: 'Clear',
                    cancelText: 'Cancel',
                    action: () => this.clearChat(payload),
                    confirmClass: 'primary',
                    showInput: false
                },
                editChatName: {
                    title: 'Edit Chat Name',
                    message: '',
                    confirmText: 'Save',
                    cancelText: 'Cancel',
                    action: () => this.updateChatName(payload),
                    confirmClass: 'primary',
                    showInput: true
                }
            };
            this.modalConfig = configs[actionType];
            this.actionToConfirm = configs[actionType].action;
            if (this.modalConfig.showInput && chat) {
                this.modalInput = chat.name;
            } else {
                this.modalInput = '';
            }
            this.isModalVisible = true;
            if (this.modalConfig.showInput) {
                this.$nextTick(() => {
                    this.$refs.modalInput.focus();
                });
            }
        },
        hideModal() {
            this.isModalVisible = false;
            this.actionToConfirm = null;
            this.modalInput = '';
        },
        confirmAction() {
            if (this.actionToConfirm) {
                this.actionToConfirm();
            }
            this.hideModal();
        },
        updateChatName(chatId) {
            const chat = this.chats.find(c => c.id === chatId);
            const newName = this.modalInput.trim();
            if (chat && newName) {
                chat.name = newName;
            }
        },
        generateUniqueId() {
            return '_' + Math.random().toString(36).substr(2, 9);
        },
        newChat() {
            // Don't create a new chat object yet. Just clear the view.
            this.$router.push('/');
            this.activeChatId = null;
        },
        switchChat(chatId) {
            this.$router.push(`/chat/${chatId}`);
            this.activeChatMenu = null;
        },
        deleteChat(chatId) {
            const index = this.chats.findIndex(chat => chat.id === chatId);
            if (index !== -1) {
                this.chats.splice(index, 1);
                if (this.activeChatId === chatId) {
                    if (this.chats.length > 0) {
                        this.switchChat(this.chats[0].id);
                    } else {
                        this.newChat();
                    }
                }
            }
        },
        clearChat(chatId) {
            const chat = this.chats.find(c => c.id === chatId);
            if (chat) {
                chat.messages = [];
            }
        }
    }
};

// 2. Define Routes
const routes = [
    {
        path: '/chat/:id',
        component: ChatComponent
    },
    {
        path: '/',
        component: ChatComponent
    }
];

// 3. Create the router instance
const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
});

// 4. Create and mount the root instance.
const App = {
    template: `<router-view></router-view>`
};
const app = Vue.createApp(App);
app.use(router);
app.mount('#app');