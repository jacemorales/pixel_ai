

let app = Vue.createApp({
    data: function(){
        return {
            app: 'Pixel AI',
            messages: []
        }
    },
        
    mounted() {
        // Load messages from localStorage on page load
        const savedMessages = localStorage.getItem("chatMessages");
        if (savedMessages) {
            this.messages = JSON.parse(savedMessages);
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
        /* getKey(){
        console.log(event.key);
        console.log(event.keyCode);
            if(event.key==="Enter"){
                const user_search = document.querySelector(".user_search");
                user_search.textContent=event.target.value,
                event.target.value="";
                user_search.style.padding=""
            }
        } */
        clearChat() {
            this.messages = [];
            localStorage.removeItem("chatMessages");
        },
  
        getKey(event) {
            const textarea = event.target;
            this.autoResize(textarea);

            if (event.key === "Enter") {
                if (event.shiftKey) {
                    const cursorPos = textarea.selectionStart;
                    const value = textarea.value;
                    textarea.value = value.slice(0, cursorPos) + "\n" + value.slice(cursorPos);
                    textarea.selectionStart = textarea.selectionEnd = cursorPos + 1;
                    event.preventDefault();
                } else {
                    const message = textarea.value.trim();
                    if (message) {
                        this.messages.push({ text: message, sender: "user_search" });
                        setTimeout(() => {
                            this.messages.push({
                                text: "AI response to: " + message,
                                sender: "search_txt"
                            });
                            this.messages.push({
                                text: "You are very beautiful thank you Very Much",
                                sender: "ai_results"
                            });
                        }, 500);
                        textarea.value = "";
                        this.autoResize(textarea);
                    }
                    event.preventDefault();
                }
            }
        },
        autoResize(textarea) {
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
        }
    }
})

app.mount('#app');