const API_BASE = 'http://localhost:8000';
let isConnected = false;
let messageCount = 1;

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const statusElement = document.getElementById('status');
const typingIndicator = document.getElementById('typing-indicator');
const messageCountElement = document.getElementById('message-count');

// Initialize the chat
document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
    setupEventListeners();
});

function initializeChat() {
    checkConnection();
    loadQuickSuggestions();
    userInput.focus();
}

function setupEventListeners() {
    // Send message on button click
    sendButton.addEventListener('click', sendMessage);
    
    // Send message on Enter key
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Input focus effects
    userInput.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    userInput.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
    });
    
    // Quick suggestion buttons
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            userInput.value = this.dataset.message;
            sendMessage();
        });
    });
}

async function checkConnection() {
    try {
        setStatus('connecting', 'Connecting to AI...');
        
        const response = await fetch(`${API_BASE}/`);
        const data = await response.json();
        
        if (data.status === 'healthy') {
            setStatus('connected', 'Connected ✓');
            isConnected = true;
            showToast('Connected to AI assistant successfully!', 'success');
        } else {
            setStatus('error', 'Connection failed');
            showToast('Failed to connect to AI', 'error');
        }
    } catch (error) {
        console.error('Connection error:', error);
        setStatus('error', 'Connection failed');
        isConnected = false;
        showToast('Cannot connect to AI server', 'error');
    }
}

function setStatus(type, message) {
    const statusDot = statusElement.querySelector('.status-dot');
    const statusText = statusElement.querySelector('.status-text');
    
    statusElement.className = `status ${type}`;
    statusText.textContent = message;
}

async function sendMessage() {
    if (!isConnected) {
        showToast('Not connected to AI. Please wait...', 'warning');
        await checkConnection();
        if (!isConnected) return;
    }
    
    const message = userInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    addMessage(message, 'user');
    userInput.value = '';
    updateMessageCount();
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Send to AI agent
        const response = await fetch(`${API_BASE}/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input_text: message,
                user_id: 'web-user',
                session_id: 'web-session-' + Date.now()
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Simulate typing delay for better UX
            setTimeout(() => {
                hideTypingIndicator();
                addMessage(data.response, 'ai', data);
                updateMessageCount();
                showToast('AI responded successfully!', 'success');
            }, 1000 + Math.random() * 1000);
            
        } else {
            throw new Error('API returned unsuccessful response');
        }
        
    } catch (error) {
        console.error('Error:', error);
        hideTypingIndicator();
        addMessage('Sorry, I encountered an error while processing your request. Please try again.', 'ai');
        updateMessageCount();
        showToast('Error processing request', 'error');
    }
}

function addMessage(text, sender, metadata = {}) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message new-message`;
    
    const timestamp = new Date().toLocaleTimeString();
    const avatar = sender === 'user' ? '👤' : '🤖';
    const senderName = sender === 'user' ? 'You' : 'AI';
    
    let metaInfo = `${senderName} • ${timestamp}`;
    if (metadata.intent) {
        metaInfo += ` • ${metadata.intent} (${Math.round(metadata.confidence * 100)}%)`;
    }
    
    messageElement.innerHTML = `
        <div class="message-avatar">
            <i class="fas ${sender === 'user' ? 'fa-user' : 'fa-robot'}"></i>
        </div>
        <div class="message-content">
            <div class="message-text">${text}</div>
            <div class="message-meta">${metaInfo}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    scrollToBottom();
    
    // Remove new-message class after animation
    setTimeout(() => {
        messageElement.classList.remove('new-message');
    }, 300);
}

function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    scrollToBottom();
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

function scrollToBottom() {
    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
    });
}

function updateMessageCount() {
    messageCount++;
    messageCountElement.textContent = `${messageCount} messages`;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function loadQuickSuggestions() {
    // You can dynamically load suggestions here
    const suggestions = [
        "What can you do?",
        "Tell me a joke",
        "How does this work?",
        "What's your name?"
    ];
    
    // Example: Add dynamic suggestions if needed
}

// Auto-reconnect every 30 seconds
setInterval(checkConnection, 30000);

// Add some interactive effects
document.addEventListener('click', function(e) {
    // Add ripple effect to buttons
    if (e.target.matches('button, .suggestion-btn')) {
        const button = e.target;
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
});

// Add CSS for ripple effect (dynamically)
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.7);
        transform: scale(0);
        animation: ripple 0.6s linear;
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    button {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(rippleStyle);