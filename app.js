// ═══════════════════════════════════
//  LIAR'S WORLD — 完整引擎 (app.js)
// ═══════════════════════════════════

const SUPABASE_URL = 'https://jhxvmwdrqwfakeaptbdt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoeHZtd2RycXdmYWtlYXB0YmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzk0MzYsImV4cCI6MjA5NDc1NTQzNn0.NJ0zwaGze_YoKCG9etfsVk8ERZiVMkO-M0sMQpWhnRE';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOCATIONS = [
    { id: 'teahouse', name: 'Tea House', icon: '🍵', capacity: 8 },
    { id: 'tavern', name: 'Tavern', icon: '🍺', capacity: 8 },
    { id: 'restaurant', name: 'Restaurant', icon: '🍽️', capacity: 6 },
    { id: 'casino', name: 'Casino', icon: '🎲', capacity: 6 },
    { id: 'farm', name: 'Farm', icon: '🌾', capacity: 2 },
    { id: 'dirtroad', name: 'Dirt Road', icon: '🛤️', capacity: 1 },
    { id: 'chiefhouse', name: "Chief's House", icon: '🏛️', capacity: 3 },
];

let currentLocation = null;
let currentCharacterId = null;
let currentCharacters = [];
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// —— DOM 元素 ——
const $locationList = document.getElementById('location-list');
const $chatTitle = document.getElementById('chat-title');
const $messages = document.getElementById('messages');
const $speakAs = document.getElementById('speak-as');
const $chatInput = document.getElementById('chat-input');
const $sendBtn = document.getElementById('send-btn');
const $voiceBtn = document.getElementById('voice-btn');
const $roleDisplay = document.getElementById('current-role-display');
const $graveCount = document.getElementById('grave-count');
const $reportCount = document.getElementById('report-count');
const $tombstoneList = document.getElementById('tombstone-list');
const $reportList = document.getElementById('report-list');
const $modalChar = document.getElementById('modal-character');
const $modalReport = document.getElementById('modal-report');

// —— 初始化 ——
async function init() {
    await loadCharacters();
    renderLocations();
    updateSpeakAsList();
    updateGraveyard();
    updateGuidePanel();
    subscribeAll();
    setInterval(checkGraveyardTimers, 5000);
    const savedCharId = localStorage.getItem('liars_world_current_char');
    if (savedCharId && currentCharacters.find(c => c.id === savedCharId && c.alive)) {
        currentCharacterId = savedCharId;
        updateUI();
    }
    bindEvents();
    console.log('✅ Liar\'s World Ready');
}

async function loadCharacters() {
    const { data } = await supabase.from('characters').select('*').eq('alive', true);
    if (data) currentCharacters = data;
}

function renderLocations() {
    $locationList.innerHTML = LOCATIONS.map(loc => {
        const count = (currentLocation === loc.id && currentCharacterId) ? 1 : 0;
        const isFull = count >= loc.capacity;
        return `<div class="location-card${currentLocation===loc.id?' active':''}${loc.id==='dirtroad'?' special':''}" data-loc="${loc.id}">
            <span class="icon">${loc.icon}</span><span class="name">${loc.name}</span>
            <span class="capacity${isFull?' full':''}">${count}/${loc.capacity}</span></div>`;
    }).join('');
}

function enterLocation(locId) {
    currentLocation = locId;
    const loc = LOCATIONS.find(l => l.id === locId);
    $chatTitle.textContent = `${loc.icon} ${loc.name}`;
    renderLocations();
    loadMessages();
    updateUI();
}

async function loadMessages() {
    if (!currentLocation) return;
    const { data } = await supabase.from('messages').select('*').eq('location_id', currentLocation).order('created_at', { ascending: true }).limit(50);
    renderMessages(data || []);
}

function renderMessages(msgs) {
    if (!msgs.length) { $messages.innerHTML = '<div class="message system">Silence. Speak in English.</div>'; return; }
    $messages.innerHTML = msgs.map(m => {
        if (m.type === 'system') return `<div class="message system">${esc(m.text)}</div>`;
        const isOwn = m.char_id === currentCharacterId;
        let content = m.audio_url ? `<div class="audio-msg" data-audio="${m.audio_url}">🔊 Voice ▶</div>` : `<div>${esc(m.text)}</div>`;
        return `<div class="message ${isOwn?'own':'other'}"><div class="sender">${esc(m.char_name)}</div>${content}${isOwn?'':`<button class="report-btn" data-char="${m.char_id}" data-msg="${m.id}">!</button>`}</div>`;
    }).join('');
    $messages.scrollTop = $messages.scrollHeight;
}

function subscribeAll() {
    supabase.channel('public:messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (payload.new.location_id === currentLocation) {
            const m = payload.new;
            const isOwn = m.char_id === currentCharacterId;
            let content = m.audio_url ? `<div class="audio-msg" data-audio="${m.audio_url}">🔊 Voice ▶</div>` : `<div>${esc(m.text)}</div>`;
            $messages.insertAdjacentHTML('beforeend', `<div class="message ${isOwn?'own':'other'}"><div class="sender">${esc(m.char_name)}</div>${content}${isOwn?'':`<button class="report-btn" data-char="${m.char_id}" data-msg="${m.id}">!</button>`}</div>`);
            $messages.scrollTop = $messages.scrollHeight;
        }
    }).subscribe();
    supabase.channel('public:reports').on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, updateGuidePanel).subscribe();
    supabase.channel('public:graveyard').on('postgres_changes', { event: '*', schema: 'public', table: 'graveyard' }, updateGraveyard).subscribe();
}

async function sendMessage() {
    if (!currentLocation || !currentCharacterId) return;
    const text = $chatInput.value.trim();
    if (!text) return;
    if (/[\u4e00-\u9fff]/.test(text)) { alert('English only!'); return; }
    const char = currentCharacters.find(c => c.id === currentCharacterId);
    await supabase.from('messages').insert({ location_id: currentLocation, char_id: currentCharacterId, char_name: char.name, text });
    $chatInput.value = '';
}

async function startRecording() {
    if (!currentLocation || !currentCharacterId) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const char = currentCharacters.find(c => c.id === currentCharacterId);
        const path = `voice_${Date.now()}.webm`;
        await supabase.storage.from('voice_messages').upload(path, blob);
        const { data } = supabase.storage.from('voice_messages').getPublicUrl(path);
        await supabase.from('messages').insert({ location_id: currentLocation, char_id: currentCharacterId, char_name: char.name, audio_url: data.publicUrl });
    };
    mediaRecorder.start();
    isRecording = true;
    $voiceBtn.classList.add('recording');
    $voiceBtn.textContent = '🔴';
}

function stopRecording() {
    if (mediaRecorder && isRecording) { mediaRecorder.stop(); $voiceBtn.classList.remove('recording'); $voiceBtn.textContent = '🎤'; isRecording = false; }
}

// 全局事件委托
function bindEvents() {
    document.addEventListener('click', async (e) => {
        // 场景点击
        if (e.target.closest('.location-card')) {
            enterLocation(e.target.closest('.location-card').dataset.loc);
        }
        // 语音播放
        if (e.target.closest('.audio-msg')) {
            const audio = new Audio(e.target.closest('.audio-msg').dataset.audio);
            audio.play();
        }
        // 举报
        if (e.target.classList.contains('report-btn')) {
            openReportModal(e.target.dataset.char, e.target.dataset.msg);
        }
    });

    // 按钮事件
    document.getElementById('btn-create-char').onclick = () => $modalChar.classList.remove('hidden');
    document.getElementById('btn-cancel-char').onclick = () => $modalChar.classList.add('hidden');
    document.getElementById('btn-submit-char').onclick = submitCharacter;
    document.getElementById('btn-cancel-report').onclick = () => $modalReport.classList.add('hidden');
    document.getElementById('btn-submit-report').onclick = submitReport;
    document.getElementById('btn-graveyard').onclick = () => document.getElementById('graveyard').classList.toggle('hidden');
    document.getElementById('btn-guide').onclick = () => document.getElementById('guide-panel').classList.toggle('hidden');
    $sendBtn.onclick = sendMessage;
    $chatInput.onkeydown = e => { if (e.key === 'Enter') sendMessage(); };
    $voiceBtn.onmousedown = startRecording;
    $voiceBtn.onmouseup = stopRecording;
    $voiceBtn.onmouseleave = stopRecording;
    $voiceBtn.ontouchstart = e => { e.preventDefault(); startRecording(); };
    $voiceBtn.ontouchend = e => { e.preventDefault(); stopRecording(); };
    $speakAs.onchange = function() {
        currentCharacterId = this.value || null;
        if (currentCharacterId) localStorage.setItem('liars_world_current_char', currentCharacterId);
        else localStorage.removeItem('liars_world_current_char');
        updateUI();
    };
}

async function submitCharacter() {
    const name = document.getElementById('char-name').value.trim();
    const identity = document.getElementById('char-identity').value.trim();
    const job = document.getElementById('char-job').value.trim();
    const age = parseInt(document.getElementById('char-age').value);
    const reason = document.getElementById('char-reason').value.trim();
    if (!name || !identity || !job || !age || !reason) return alert('All fields required.');
    const { data } = await supabase.from('characters').insert({ name, identity, job, age, reason, alive: true }).select().single();
    if (data) {
        currentCharacterId = data.id;
        localStorage.setItem('liars_world_current_char', data.id);
        await loadCharacters();
        $modalChar.classList.add('hidden');
        updateUI();
    }
}

function updateUI() {
    updateSpeakAsList();
    const char = currentCharacters.find(c => c.id === currentCharacterId);
    $roleDisplay.textContent = char ? `👤 ${char.name}` : '👤 Not in character';
    const active = !!(currentCharacterId && currentLocation);
    $chatInput.disabled = !active;
    $sendBtn.disabled = !active;
    $voiceBtn.disabled = !active;
}

function updateSpeakAsList() {
    $speakAs.innerHTML = '<option value="">-- Speak as... --</option>' + currentCharacters.map(c => `<option value="${c.id}" ${c.id===currentCharacterId?'selected':''}>${esc(c.name)}</option>`).join('');
}

async function updateGraveyard() {
    const { data } = await supabase.from('graveyard').select('*').order('death_time', { ascending: false });
    $graveCount.textContent = data ? data.length : 0;
    if (!data || data.length === 0) return;
    $tombstoneList.innerHTML = data.map(g => {
        const remaining = Math.max(0, 600 - Math.floor((Date.now() - new Date(g.death_time).getTime()) / 1000));
        const canRevive = remaining <= 0;
        return `<div class="tombstone"><span>🪦 ${esc(g.char_name)}</span><span>${canRevive ? '🌱' : Math.floor(remaining/60)+':'+(remaining%60).toString().padStart(2,'0')}</span>${canRevive?`<button class="revive-btn" data-char="${g.char_id}" data-grave="${g.id}">Return</button>`:''}</div>`;
    }).join('');
}

async function updateGuidePanel() {
    const { data } = await supabase.from('reports').select('*').eq('status', 'pending');
    $reportCount.textContent = data ? data.length : 0;
    if (!data || data.length === 0) { $reportList.innerHTML = '<p>No pending reports.</p>'; return; }
    $reportList.innerHTML = data.map(r => `<div class="report-item"><div>Target: ${r.reported_char_id}</div><div>Reason: ${esc(r.reason)}</div><div class="btns"><button class="btn small danger" data-report="${r.id}" data-action="approve">💀</button><button class="btn small" data-report="${r.id}" data-action="reject">✅</button></div></div>`).join('');
}

// 举报与裁定
function openReportModal(charId, msgId) {
    document.getElementById('report-target-display').textContent = `Reporting character: ${charId}`;
    $modalReport.dataset.charId = charId;
    $modalReport.dataset.msgId = msgId;
    $modalReport.classList.remove('hidden');
}
async function submitReport() {
    await supabase.from('reports').insert({
        reported_char_id: $modalReport.dataset.charId,
        reporter_char_id: currentCharacterId,
        reason: document.getElementById('report-reason').value,
        status: 'pending'
    });
    $modalReport.classList.add('hidden');
}
document.addEventListener('click', async (e) => {
    if (e.target.dataset.report && e.target.dataset.action) {
        const { report, action } = e.target.dataset;
        const { data: r } = await supabase.from('reports').select('*').eq('id', report).single();
        if (!r || r.status !== 'pending') return;
        if (action === 'approve') {
            await supabase.from('reports').update({ status: 'approved' }).eq('id', report);
            await supabase.from('characters').update({ alive: false }).eq('id', r.reported_char_id);
            const char = currentCharacters.find(c => c.id === r.reported_char_id);
            await supabase.from('graveyard').insert({ char_id: r.reported_char_id, char_name: char?.name || 'Unknown', reason: r.reason });
            if (currentCharacterId === r.reported_char_id) { currentCharacterId = null; updateUI(); }
        } else {
            await supabase.from('reports').update({ status: 'rejected' }).eq('id', report);
        }
        await loadCharacters();
        updateGuidePanel();
        updateGraveyard();
    }
    if (e.target.classList.contains('revive-btn')) {
        const { char, grave } = e.target.dataset;
        await supabase.from('graveyard').delete().eq('id', grave);
        await supabase.from('characters').delete().eq('id', char);
        await loadCharacters();
        updateGraveyard();
        $modalChar.classList.remove('hidden');
    }
});

async function checkGraveyardTimers() {
    const { data } = await supabase.from('graveyard').select('*').eq('revivable', false);
    if (!data) return;
    data.forEach(async g => {
        if ((Date.now() - new Date(g.death_time).getTime()) > 600000) {
            await supabase.from('graveyard').update({ revivable: true }).eq('id', g.id);
        }
    });
}

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

init();