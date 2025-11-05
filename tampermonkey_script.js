// ==UserScript==
// @name         YouTube Live Chat Scraper - GO
// @author       Adipati Rezkya
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Kirim live chat YouTube ke WebSocket lokal
// @match        https://www.youtube.com/live_chat*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const WS_SERVER = 'ws://localhost:8080';
    let ws = null;
    const MAX_CACHE_SIZE = 1000; // Limit cache ke 1000 pesan
    const processedMessages = new Set();

    // Connect ke WebSocket server
    function connectWebSocket() {
        try {
            ws = new WebSocket(WS_SERVER);

            ws.onopen = () => {
                console.log('[YT Chat] Connected to WebSocket server');
            };

            ws.onerror = (error) => {
                console.error('[YT Chat] WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('[YT Chat] Disconnected from server, reconnecting in 3s...');
                setTimeout(connectWebSocket, 3000);
            };
        } catch (err) {
            console.error('[YT Chat] Connection failed:', err);
        }
    }

    // Scrape dan kirim pesan live chat
    function scrapeLiveChat() {
        const allMessages = document.querySelectorAll('yt-live-chat-text-message-renderer');
        const messages = Array.from(allMessages).slice(-20); // Convert ke Array dulu, baru slice

        messages.forEach((msgElement) => {
            const messageId = msgElement.getAttribute('id');

            // Hanya proses pesan yang belum diproses sebelumnya
            if (processedMessages.has(messageId)) {
                return;
            }

            try {
                const author = msgElement.querySelector('#author-name')?.textContent?.trim() || 'Unknown';
                const authorImage = msgElement.querySelector('#author-photo img')?.src || null;
                const isMember = msgElement.querySelector('#chat-badges')?.querySelector('yt-live-chat-author-badge-renderer[type="member"]') !== null;
                const isModerator = msgElement.querySelector('#chat-badges')?.querySelector('yt-live-chat-author-badge-renderer[type="moderator"]') !== null;
                const memberBadgeImage = isMember ? msgElement.querySelector('#chat-badges')?.querySelector('yt-live-chat-author-badge-renderer[type="member"] #image img')?.src || null : null;
                let message = '';
                const messageElement = msgElement.querySelector('#message');
                if (messageElement) {
                    Array.from(messageElement.childNodes).forEach((node) => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            message += node.textContent;
                        } else if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.tagName === 'IMG') {
                                message += (":__" + node.src + "__:") || '';
                            } else {
                                message += node.textContent;
                            }
                        }
                    });
                }
                message = message.trim();
                const timestamp = new Date().toISOString();

                if (message) {
                    const chatData = {
                        author: author,
                        authorImage: authorImage,
                        message: message,
                        isMember: isMember,
                        isModerator: isModerator,
                        memberBadgeImage: memberBadgeImage,
                        timestamp: timestamp
                    };

                    // Kirim ke WebSocket
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify(chatData));
                        console.log(`[YT Chat] Sent: ${author}: ${message}`);
                    }

                    // Tandai sebagai sudah diproses
                    processedMessages.add(messageId);

                    // Jika cache sudah terlalu besar, hapus yang paling lama
                    if (processedMessages.size > MAX_CACHE_SIZE) {
                        const firstItem = processedMessages.values().next().value;
                        processedMessages.delete(firstItem);
                        console.log('[YT Chat] Cache cleared - size:', processedMessages.size);
                    }
                }
            } catch (err) {
                console.error('[YT Chat] Error processing message:', err);
            }
        });

        const allMembershipMessages = document.querySelectorAll('yt-live-chat-membership-item-renderer');
        const membershipMessages = Array.from(allMembershipMessages).slice(-20);

        membershipMessages.forEach((msgElement) => {
            const messageId = msgElement.getAttribute('id');
            if (processedMessages.has(messageId)) {
                return;
            }

            try {
                const author = msgElement.querySelector('#author-name')?.textContent?.trim() || 'Unknown';
                const authorImage = msgElement.querySelector('#author-photo img')?.src || null;
                const isMember = true;
                const isModerator = msgElement.querySelector('#chat-badges')?.querySelector('yt-live-chat-author-badge-renderer[type="moderator"]') !== null;
                const memberBadgeImage = isMember ? msgElement.querySelector('#chat-badges')?.querySelector('yt-live-chat-author-badge-renderer[type="member"] #image img')?.src || null : null;
                const message = msgElement.querySelector('#content #message')?.textContent?.trim() || 'Joined the membership';
                const timestamp = new Date().toISOString();
                const chatData = {
                    isMembershipJoin: true,
                    author,
                    authorImage,
                    message,
                    isMember,
                    isModerator,
                    memberBadgeImage,
                    timestamp
                };
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(chatData));
                    console.log(`[YT Chat] Sent: ${author}: ${message}`);
                }
                processedMessages.add(messageId);
                if (processedMessages.size > MAX_CACHE_SIZE) {
                    const firstItem = processedMessages.values().next().value;
                    processedMessages.delete(firstItem);
                    console.log('[YT Chat] Cache cleared - size:', processedMessages.size);
                }
            } catch (err) {
                console.error('[YT Chat] Error processing membership message:', err);
            }
        });
    }

    // Initialize
    connectWebSocket();

    // Monitor live chat setiap 500ms
    setInterval(scrapeLiveChat, 500);

    console.log('[YT Chat] Script loaded - monitoring live chat...');
})();