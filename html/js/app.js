'use strict';

// ─── State ────────────────────────────────────────────────────────────────────
let selectedPlayer = null;
let toastTimer     = null;

// ─── DOM References ───────────────────────────────────────────────────────────
const overlay          = document.getElementById('overlay');
const closeBtn         = document.getElementById('closeBtn');
const searchCitizenId  = document.getElementById('searchCitizenId');
const searchBtn        = document.getElementById('searchBtn');
const searchStatus     = document.getElementById('searchStatus');
const playerList       = document.getElementById('playerList');
const playerCount      = document.getElementById('playerCount');
const editSection      = document.getElementById('editSection');
const editCitizenDisplay = document.getElementById('editCitizenDisplay');
const inputFirst       = document.getElementById('inputFirst');
const inputLast        = document.getElementById('inputLast');
const cancelEdit       = document.getElementById('cancelEdit');
const applyBtn         = document.getElementById('applyBtn');
const applyText        = document.getElementById('applyText');
const applyLoader      = document.getElementById('applyLoader');
const toast            = document.getElementById('toast');
const toastMsg         = document.getElementById('toastMsg');

// ─── NUI Message Handler ──────────────────────────────────────────────────────
window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || !data.action) return;

    switch (data.action) {
        case 'open':
            openPanel(data.players || []);
            break;
        case 'close':
            closePanel();
            break;
        case 'changeSuccess':
            onChangeSuccess(data.data);
            break;
    }
});

// ─── Open / Close Panel ───────────────────────────────────────────────────────
function openPanel(players) {
    overlay.classList.remove('hidden');
    renderPlayers(players);
    resetEdit();
    searchCitizenId.value = '';
    hideSearchStatus();
}

function closePanel() {
    overlay.classList.add('hidden');
    selectedPlayer = null;
    resetEdit();
}

// ─── Render Players ───────────────────────────────────────────────────────────
function renderPlayers(players) {
    playerCount.textContent = players.length;

    if (!players.length) {
        playerList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 9h.01M16 9h.01"/>
                    <path d="M9 15s1 2 3 2 3-2 3-2"/>
                </svg>
                <p>No players online</p>
            </div>`;
        return;
    }

    playerList.innerHTML = '';
    players.forEach((p, i) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.style.animationDelay = (i * 0.03) + 's';

        const initials = ((p.firstname?.[0] || '?') + (p.lastname?.[0] || '')).toUpperCase();
        const fullName  = `${p.firstname} ${p.lastname}`;

        card.innerHTML = `
            <div class="player-avatar">${sanitize(initials)}</div>
            <div class="player-info">
                <div class="player-name">${sanitize(fullName)}</div>
                <div class="player-meta">
                    <span class="player-cid">${sanitize(p.citizenid)}</span>
                    <span class="player-sid">ID: ${p.serverId}</span>
                </div>
            </div>
            <div class="player-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                </svg>
            </div>`;

        card.addEventListener('click', () => selectPlayer(p, card));
        playerList.appendChild(card);
    });
}

// ─── Select Player ────────────────────────────────────────────────────────────
function selectPlayer(p, cardEl) {
    // Deselect previous
    document.querySelectorAll('.player-card.selected').forEach(c => c.classList.remove('selected'));
    cardEl.classList.add('selected');

    selectedPlayer = p;
    showEditSection(p);
}

// ─── Edit Section ─────────────────────────────────────────────────────────────
function showEditSection(p) {
    editSection.classList.remove('hidden');
    editCitizenDisplay.textContent = p.citizenid;
    inputFirst.value = p.firstname || '';
    inputLast.value  = p.lastname  || '';
    resetApplyBtn();

    // Scroll edit into view
    editSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetEdit() {
    editSection.classList.add('hidden');
    selectedPlayer  = null;
    inputFirst.value = '';
    inputLast.value  = '';
    resetApplyBtn();
    document.querySelectorAll('.player-card.selected').forEach(c => c.classList.remove('selected'));
}

function resetApplyBtn() {
    applyBtn.disabled = false;
    applyBtn.classList.remove('success');
    applyText.textContent = 'APPLY CHANGE';
    applyLoader.classList.add('hidden');
}

// ─── Search Citizen ID ────────────────────────────────────────────────────────
function doSearch() {
    const cid = searchCitizenId.value.trim();
    if (!cid) {
        showSearchStatus('Enter a Citizen ID!', 'error');
        return;
    }

    searchBtn.disabled  = true;
    searchBtn.textContent = 'SEARCHING...';

    fetchNui('searchCitizen', { citizenid: cid }, (result) => {
        searchBtn.disabled  = false;
        searchBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> SEARCH`;

        if (!result || result.error) {
            showSearchStatus('Player not found in database!', 'error');
            return;
        }

        showSearchStatus(`Found: ${result.firstname} ${result.lastname}`, 'success');

        // Use as selected player
        const fakeCard = { citizenid: cid, firstname: result.firstname, lastname: result.lastname, serverId: 'Offline' };
        selectedPlayer = fakeCard;
        showEditSection(fakeCard);
    });
}

// ─── Apply Name Change ────────────────────────────────────────────────────────
function applyChange() {
    if (!selectedPlayer) return;

    const newFirst = inputFirst.value.trim();
    const newLast  = inputLast.value.trim();

    if (!newFirst || !newLast) {
        showToast('Fill in both first and last name!', 'error');
        return;
    }
    if (newFirst.length < 2 || newFirst.length > 30) {
        showToast('First name must be 2-30 characters!', 'error');
        return;
    }
    if (newLast.length < 2 || newLast.length > 30) {
        showToast('Last name must be 2-30 characters!', 'error');
        return;
    }

    // Loading state
    applyBtn.disabled = true;
    applyText.textContent = 'APPLYING...';
    applyLoader.classList.remove('hidden');

    fetchNui('changeName', {
        citizenid: selectedPlayer.citizenid,
        firstname: newFirst,
        lastname:  newLast,
    }, () => {});
}

// ─── On Change Success (from server) ─────────────────────────────────────────
function onChangeSuccess(data) {
    applyLoader.classList.add('hidden');
    applyBtn.classList.add('success');
    applyText.textContent = '✓ CHANGED';

    showToast(`${data.firstname} ${data.lastname} updated!`, 'success');

    // Update the card in the list if it exists
    document.querySelectorAll('.player-card').forEach(card => {
        const cidEl = card.querySelector('.player-cid');
        if (cidEl && cidEl.textContent === data.citizenid) {
            card.querySelector('.player-name').textContent = `${data.firstname} ${data.lastname}`;
            card.querySelector('.player-avatar').textContent = (data.firstname[0] + data.lastname[0]).toUpperCase();
        }
    });

    // Update selected player state
    if (selectedPlayer) {
        selectedPlayer.firstname = data.firstname;
        selectedPlayer.lastname  = data.lastname;
    }

    setTimeout(resetApplyBtn, 2500);
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
function showSearchStatus(msg, type) {
    searchStatus.textContent = msg;
    searchStatus.className   = `search-status ${type}`;
}

function hideSearchStatus() {
    searchStatus.className = 'search-status hidden';
    searchStatus.textContent = '';
}

function showToast(msg, type = 'success') {
    clearTimeout(toastTimer);
    toastMsg.textContent = msg;
    toast.className = `toast ${type}`;
    toastTimer = setTimeout(() => { toast.classList.add('hidden'); }, 3500);
}

function sanitize(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}

// ─── NUI Fetch ────────────────────────────────────────────────────────────────
function fetchNui(event, data, cb) {
    fetch(`https://Project07_NameChanger/${event}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
    })
    .then(r => r.json())
    .then(cb)
    .catch(err => {
        console.error('[NameChange]', err);
        cb(null);
    });
}

// ─── GetParentResourceName fallback (for browser preview) ────────────────────
if (typeof GetParentResourceName === 'undefined') {
    window.GetParentResourceName = () => 'Project07_NameChanger';
}

// ─── Event Listeners ──────────────────────────────────────────────────────────
closeBtn.addEventListener('click', () => {
    fetchNui('closeMenu', {}, () => {});
    closePanel();
});

searchBtn.addEventListener('click', doSearch);

searchCitizenId.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
    hideSearchStatus();
});

cancelEdit.addEventListener('click', resetEdit);

applyBtn.addEventListener('click', applyChange);

inputFirst.addEventListener('keydown', (e) => { if (e.key === 'Enter') inputLast.focus(); });
inputLast.addEventListener('keydown',  (e) => { if (e.key === 'Enter') applyChange(); });

// ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
        fetchNui('closeMenu', {}, () => {});
        closePanel();
    }
});

