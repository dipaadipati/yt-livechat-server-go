const chatContainer = document.getElementById('chatContainer');
let chats = [];
let emojis = {};
let ws = null;

function connectWebSocket() {
    ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
        console.log('Connected to server');
        loadChatHistory();
        loadEmojis();
    };

    ws.onmessage = (event) => {
        try {
            const chat = JSON.parse(event.data);
            addChatToUI(chat);
        } catch (err) {
            console.error('Error parsing message:', err);
        }
    };

    ws.onclose = () => {
        console.log('Disconnected from server');
        setTimeout(connectWebSocket, 3000);
    };
}

function loadChatHistory() {
    fetch('/api/chats')
        .then(res => res.json())
        .then(data => {
            chats = data;
            renderChats();
        })
        .catch(err => console.error('Error loading history:', err));
}

function loadEmojis() {
    fetch('/api/emojis')
        .then(res => res.json())
        .then(data => {
            emojis = data.emojis;
        })
        .catch(err => console.error('Error loading emojis:', err));
}

function addChatToUI(chat) {
    chats.push(chat);
    renderChats();
    setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 0);
}

function renderChats() {
    if (chats.length === 0) {
        chatContainer.innerHTML = '<div class="empty-state"><p>Waiting for messages...</p></div>';
        return;
    }

    chatContainer.innerHTML = chats.map(chat => `
        <div class="chat-item">
            <div class="chat-avatar">
                ${chat.authorImage ? `<img src="${chat.authorImage}" alt="${chat.author}">` : ''}
            </div>
            <div class="chat-content">
                <div class="chat-header">
                    <span class="chat-author${chat.isModerator ? ' moderator' : (chat.isMember ? ' member' : '')}">${chat.author}${(() => {
            let badges = '';
            if (chat.isModerator) {
                badges += ' <div class="moderator-badge"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" focusable="false" aria-hidden="true" style="pointer-events: none; display: inherit; width: 100%; height: 100%;"><path d="M9.64589146,7.05569719 C9.83346524,6.562372 9.93617022,6.02722257 9.93617022,5.46808511 C9.93617022,3.00042984 7.93574038,1 5.46808511,1 C4.90894765,1 4.37379823,1.10270499 3.88047304,1.29027875 L6.95744681,4.36725249 L4.36725255,6.95744681 L1.29027875,3.88047305 C1.10270498,4.37379824 1,4.90894766 1,5.46808511 C1,7.93574038 3.00042984,9.93617022 5.46808511,9.93617022 C6.02722256,9.93617022 6.56237198,9.83346524 7.05569716,9.64589147 L12.4098057,15 L15,12.4098057 L9.64589146,7.05569719 Z"></path></svg></div>';
            }
            if (chat.isMember && chat.memberBadgeImage) {
                badges += ` <img class="member-badge" src="${chat.memberBadgeImage}" alt="Member Badge">`;
            }
            return badges;
        })()}</span>
                </div>
                <div class="chat-message">${(() => {
            let msg = chat.message;
            if (Object.keys(emojis).length > 0) {
                let splittedMsg = msg.split(' ');
                splittedMsg = splittedMsg.map(word => {
                    if (emojis[word]) {
                        return `<img class="chat-emoji" src="${emojis[word]}" alt="emoji">`;
                    }
                    return word;
                });
                msg = splittedMsg.join(' ');
            }
            const emojiRegex = /:__(.+?)__:/g;
            let result = '';
            let lastIndex = 0;
            let match;
            while ((match = emojiRegex.exec(msg)) !== null) {
                result += msg.substring(lastIndex, match.index);
                result += `<img class="chat-emoji" src="${match[1]}" alt="emoji">`;
                lastIndex = match.index + match[0].length;
            }
            result += msg.substring(lastIndex);
            return result;
        })()}</div>
            </div>
        </div>
    `).join('');

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

connectWebSocket();