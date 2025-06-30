function toggleDebug() {
    debugMode = !debugMode;
    const debugPanel = document.getElementById('debugPanel');
    if (debugMode) {
        debugPanel.style.display = 'block';
        updateDebugInfo();
        console.log('🐛 Debug mode enabled');
    } else {
        debugPanel.style.display = 'none';
        console.log('🐛 Debug mode disabled');
    }
}

function updateDebugInfo() {
    if (!debugMode) return;

    document.getElementById('debugUrl').textContent = window.location.href;
    document.getElementById('debugUserId').textContent = selectedUserId || 'None';
    document.getElementById('debugUserName').textContent = selectedUserName || 'None';

    const userElement = document.querySelector(`[data-user-id="${selectedUserId}"]`);
    document.getElementById('debugUserFound').textContent = userElement ? 'Yes' : 'No';

    const totalUsers = document.querySelectorAll('.user-item').length;
    document.getElementById('debugTotalUsers').textContent = totalUsers;

    document.getElementById('debugStrategy').textContent = lastSearchStrategy;

    const signalRStatus = connection && connection.state === 'Connected' ? 'Connected' : 'Disconnected';
    document.getElementById('debugSignalR').textContent = signalRStatus;
}

function forceSelectUser() {
    if (selectedUserId && selectedUserName) {
        console.log('🔧 Force selecting user...');
        selectUser(selectedUserId, selectedUserName);
    } else {
        alert('No user data to force select');
    }
}

function listAllUsers() {
    console.log('📋 === ALL USERS IN SIDEBAR ===');
    const userItems = document.querySelectorAll('.user-item');
    userItems.forEach((item, index) => {
        const userId = item.getAttribute('data-user-id');
        const userName = item.getAttribute('data-user-name');
        console.log(`${index + 1}. ID: "${userId}", Name: "${userName}"`);

        if (userId === selectedUserId) {
            console.log('   ✅ THIS IS THE SELECTED USER');
        }
    });

    if (userItems.length === 0) {
        console.log('❌ No users found in sidebar');
    }
}

function testAutoSelect() {
    console.log('🧪 Testing auto-select with current parameters...');
    const urlParams = new URLSearchParams(window.location.search);
    const testUserId = urlParams.get('userId');
    const testUserName = urlParams.get('userName');

    if (testUserId && testUserName) {
        selectUser(testUserId, decodeURIComponent(testUserName));
    } else {
        alert('No URL parameters found for testing');
    }
}

function selectUser(userId, userName) {
    console.log('🎯 === SELECT USER CALLED ===');
    console.log('Input userId:', userId);
    console.log('Input userName:', userName);
    console.log('Type of userId:', typeof userId);
    console.log('Type of userName:', typeof userName);

    lastSearchStrategy = 'none';

    if (!userId) {
        console.error('❌ userId is null, undefined, or empty');
        lastSearchStrategy = 'failed-no-userid';
        updateDebugInfo();
        return;
    }

    if (!userName) {
        console.error('❌ userName is null, undefined, or empty');
        lastSearchStrategy = 'failed-no-username';
        updateDebugInfo();
        return;
    }

    if (userId.trim() === '') {
        console.error('❌ userId is empty string after trim');
        lastSearchStrategy = 'failed-empty-userid';
        updateDebugInfo();
        return;
    }

    if (userName.trim() === '') {
        console.error('❌ userName is empty string after trim');
        lastSearchStrategy = 'failed-empty-username';
        updateDebugInfo();
        return;
    }

    selectedUserId = userId.trim();
    selectedUserName = userName.trim();

    console.log('✅ Validation passed');
    console.log('Cleaned userId:', selectedUserId);
    console.log('Cleaned userName:', selectedUserName);

    document.getElementById('selectedUserName').textContent = selectedUserName;
    document.getElementById('chatHeader').classList.remove('d-none');
    document.getElementById('noChatSelected').style.display = 'none';

    const controls = ['messageInput', 'sendButton', 'attachButton', 'voiceButton', 'audioCallButton', 'videoCallButton'];
    controls.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.disabled = false;
            if (id === 'messageInput') {
                element.placeholder = `Nhắn tin với ${selectedUserName}...`;
                setTimeout(() => element.focus(), 100);
            }
        }
    });

    console.log('✅ UI updated and controls enabled');

    let selectedUserElement = null;

    console.log('🔍 Strategy 1: Searching by exact ID match...');
    selectedUserElement = document.querySelector(`[data-user-id="${selectedUserId}"]`);
    if (selectedUserElement) {
        lastSearchStrategy = 'exact-id-match';
        console.log('✅ Found by exact ID match');
    } else {
        console.log('❌ Not found by exact ID match');
    }

    if (!selectedUserElement) {
        console.log('🔍 Strategy 2: Searching by exact name match...');
        selectedUserElement = document.querySelector(`[data-user-name="${selectedUserName}"]`);
        if (selectedUserElement) {
            lastSearchStrategy = 'exact-name-match';
            console.log('✅ Found by exact name match');
        } else {
            console.log('❌ Not found by exact name match');
        }
    }

    if (!selectedUserElement) {
        console.log('🔍 Strategy 3: Searching by case-insensitive name...');
        const userItems = document.querySelectorAll('.user-item');
        userItems.forEach((item, index) => {
            const itemUserName = item.getAttribute('data-user-name');
            console.log(`  Checking item ${index}: "${itemUserName}"`);
            if (itemUserName && itemUserName.toLowerCase() === selectedUserName.toLowerCase()) {
                selectedUserElement = item;
                lastSearchStrategy = 'case-insensitive-name';
                console.log('✅ Found by case-insensitive name match');
            }
        });
        if (!selectedUserElement) {
            console.log('❌ Not found by case-insensitive name');
        }
    }

    if (!selectedUserElement) {
        console.log('🔍 Strategy 4: Searching by partial name match...');
        const userItems = document.querySelectorAll('.user-item');
        userItems.forEach((item, index) => {
            const itemUserName = item.getAttribute('data-user-name');
            if (itemUserName && itemUserName.toLowerCase().includes(selectedUserName.toLowerCase())) {
                selectedUserElement = item;
                lastSearchStrategy = 'partial-name-match';
                console.log(`✅ Found by partial name match at item ${index}`);
            }
        });
        if (!selectedUserElement) {
            console.log('❌ Not found by partial name match');
        }
    }

    if (!selectedUserElement) {
        console.log('🔍 Strategy 5: Searching by partial ID match...');
        const userItems = document.querySelectorAll('.user-item');
        userItems.forEach((item, index) => {
            const itemUserId = item.getAttribute('data-user-id');
            if (itemUserId && itemUserId.includes(selectedUserId)) {
                selectedUserElement = item;
                lastSearchStrategy = 'partial-id-match';
                console.log(`✅ Found by partial ID match at item ${index}`);
            }
        });
        if (!selectedUserElement) {
            console.log('❌ Not found by partial ID match');
        }
    }

    if (!selectedUserElement) {
        console.log('🔍 Strategy 6: Brute force search with detailed logging...');
        const userItems = document.querySelectorAll('.user-item');
        console.log(`Total items to search: ${userItems.length}`);

        userItems.forEach((item, index) => {
            const itemUserId = item.getAttribute('data-user-id');
            const itemUserName = item.getAttribute('data-user-name');

            console.log(`Item ${index}:`);
            console.log(`  data-user-id: "${itemUserId}"`);
            console.log(`  data-user-name: "${itemUserName}"`);
            console.log(`  ID match: ${itemUserId === selectedUserId}`);
            console.log(`  Name match: ${itemUserName === selectedUserName}`);

            if (itemUserId === selectedUserId || itemUserName === selectedUserName) {
                selectedUserElement = item;
                lastSearchStrategy = 'brute-force-match';
                console.log(`✅ Found by brute force at item ${index}`);
            }
        });
    }

    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });

    if (selectedUserElement) {
        selectedUserElement.classList.add('active');
        selectedUserElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        console.log(`✅ User highlighted using strategy: ${lastSearchStrategy}`);
    } else {
        lastSearchStrategy = 'not-found';
        console.warn('⚠️ User not found in sidebar with any strategy');
        console.log('=== AVAILABLE USERS DEBUG ===');
        const userItems = document.querySelectorAll('.user-item');
        if (userItems.length === 0) {
            console.log('❌ NO USERS FOUND IN SIDEBAR AT ALL');
        } else {
            userItems.forEach((item, index) => {
                const itemUserId = item.getAttribute('data-user-id');
                const itemUserName = item.getAttribute('data-user-name');
                console.log(`${index + 1}. ID: "${itemUserId}", Name: "${itemUserName}"`);
            });
        }
    }

    console.log('📚 Loading chat history...');
    document.getElementById('messages').innerHTML = '';
    loadChatHistory(selectedUserId);

    updateDebugInfo();

    console.log('✅ User selection completed');
    console.log(`Final strategy used: ${lastSearchStrategy}`);
    console.log('🎯 === END SELECT USER ===');
}