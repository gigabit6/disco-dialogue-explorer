
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
});

    async function postJSON(url, body) {
    const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
});
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

    // --- Search ---
    const searchText = document.getElementById('searchText');
    const searchActorName = document.getElementById('searchActorName');
    const searchStyle = document.getElementById('searchStyle');
    const btnSearch = document.getElementById('btnSearch');
    const resultsList = document.getElementById('resultsList');
    const resultsCount = document.getElementById('resultsCount');
    const selectedLineText = document.getElementById('selectedLineText');
    const currentLinePreview = document.getElementById('currentLinePreview');
    const btnGoToBrowse = document.getElementById('btnGoToBrowse');

    let lastSearchResults = [];

    btnSearch.addEventListener('click', async () => {
    resultsList.innerHTML = '';
    resultsCount.textContent = 'Searching...';
    selectedLineText.textContent = '(none)';
    currentLinePreview.value = '';
    btnGoToBrowse.disabled = true;

    try {
    const data = await postJSON('/api/search', {
    query: searchText.value,
    actorId: searchActorName.value,
    style: searchStyle.value
});
    lastSearchResults = data.results || [];
    resultsCount.textContent = `${lastSearchResults.length} result(s)`;
    lastSearchResults.forEach((text, idx) => {
    const li = document.createElement('li');
    li.textContent = `${idx}: ${text}`;
    li.dataset.index = idx;
    resultsList.appendChild(li);
});
} catch (e) {
    resultsCount.textContent = 'Error: ' + e.message;
}
});

    resultsList.addEventListener('click', async (ev) => {
    const li = ev.target.closest('li');
    if (!li) return;
    const index = parseInt(li.dataset.index, 10);
    try {
    const data = await postJSON('/api/select-search', { index });
    selectedLineText.textContent = data.selectedLine || '(none)';
    currentLinePreview.value = data.convoText || '';
    btnGoToBrowse.disabled = false;
    // Also prime browse tab content
    updateBrowseUI(data);
} catch (e) {
    selectedLineText.textContent = 'Error: ' + e.message;
}
});

    btnGoToBrowse.addEventListener('click', () => {
        document.querySelector('.tab[data-tab="browse"]').click();
    });

    // --- Checks ---
    const checkSkill = document.getElementById('checkSkill');
    const checkMinDiff = document.getElementById('checkMinDiff');
    const checkMaxDiff = document.getElementById('checkMaxDiff');
    const btnCheckSearch = document.getElementById('btnCheckSearch');
    const checkResultsList = document.getElementById('checkResultsList');
    const checkResultsCount = document.getElementById('checkResultsCount');
    const checkCurrentLinePreview = document.getElementById('checkCurrentLinePreview');
    const btnCheckGoToBrowse = document.getElementById('btnCheckGoToBrowse');

    let lastCheckResults = [];

    async function loadCheckMeta() {
        try {
            const res = await fetch('/api/checks-meta');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const meta = await res.json();

            // Skills
            checkSkill.innerHTML = '';
            const anyOpt = document.createElement('option');
            anyOpt.value = '';
            anyOpt.textContent = '(any skill)';
            checkSkill.appendChild(anyOpt);

            (meta.skills || []).forEach((skill) => {
                const opt = document.createElement('option');
                opt.value = skill;
                opt.textContent = skill;
                checkSkill.appendChild(opt);
            });

            // Difficulty bounds
            const min = meta.minDifficulty ?? 0;
            const max = meta.maxDifficulty ?? 0;

            checkMinDiff.min = min;
            checkMinDiff.max = max;
            checkMaxDiff.min = min;
            checkMaxDiff.max = max;

            checkMinDiff.value = min;
            checkMaxDiff.value = max;
        } catch (e) {
            console.error('Failed to load check meta:', e);
        }
    }

    btnCheckSearch.addEventListener('click', async () => {
        checkResultsList.innerHTML = '';
        checkResultsCount.textContent = 'Searching...';
        checkCurrentLinePreview.value = '';
        btnCheckGoToBrowse.disabled = true;

        try {
            const data = await postJSON('/api/search-checks', {
                skill: checkSkill.value || null,
                minDifficulty: checkMinDiff.value,
                maxDifficulty: checkMaxDiff.value,
            });

            lastCheckResults = data.results || [];
            checkResultsCount.textContent = `${lastCheckResults.length} result(s)`;

            lastCheckResults.forEach((text, idx) => {
                const li = document.createElement('li');
                li.textContent = `${idx}: ${text}`;
                li.dataset.index = idx;
                checkResultsList.appendChild(li);
            });
        } catch (e) {
            checkResultsCount.textContent = 'Error: ' + e.message;
        }
    });

    checkResultsList.addEventListener('click', async (ev) => {
        const li = ev.target.closest('li');
        if (!li) return;
        const index = parseInt(li.dataset.index, 10);

        try {
            const data = await postJSON('/api/select-check', { index });
            checkCurrentLinePreview.value = data.convoText || '';
            btnCheckGoToBrowse.disabled = false;

            // Prime the Browse tab in exactly the same way as the search tab
            updateBrowseUI(data);
        } catch (e) {
            checkCurrentLinePreview.value = 'Error: ' + e.message;
        }
    });

    btnCheckGoToBrowse.addEventListener('click', () => {
        document.querySelector('.tab[data-tab="browse"]').click();
    });

    // Load initial meta (skills + bounds) when the page starts
    loadCheckMeta();

    // --- Browse ---
    const browseConvo = document.getElementById('browseConvo');
    const browseConversationInfo = document.getElementById('browseConversationInfo');
    const backOptions = document.getElementById('backOptions');
    const forwardOptions = document.getElementById('forwardOptions');

    function updateBrowseUI(data) {
    browseConvo.value = data.convoText || '';
    browseConversationInfo.textContent = data.conversationInfo || '';
    backOptions.innerHTML = '';
    forwardOptions.innerHTML = '';

    (data.backwardOptions || []).forEach((opt, idx) => {
    const li = document.createElement('li');
    li.textContent = opt;
    li.dataset.index = idx;
    li.addEventListener('click', () => trace('backward', idx));
    backOptions.appendChild(li);
});

    (data.forwardOptions || []).forEach((opt, idx) => {
    const li = document.createElement('li');
    li.textContent = opt;
    li.dataset.index = idx;
    li.addEventListener('click', () => trace('forward', idx));
    forwardOptions.appendChild(li);
});
}

    async function trace(direction, index) {
    try {
    const data = await postJSON('/api/trace', { direction, index });
    updateBrowseUI(data);
} catch (e) {
    alert('Trace error: ' + e.message);
}
}

    // --- Dump ---
    const btnDumpConvo = document.getElementById('btnDumpConvo');
    const btnDumpActor = document.getElementById('btnDumpActor');
    const dumpActorName = document.getElementById('dumpActorName');
    const dumpText = document.getElementById('dumpText');
    const dumpConversationInfo = document.getElementById('dumpConversationInfo');

    btnDumpConvo.addEventListener('click', async () => {
    try {
    const data = await postJSON('/api/dump-convo');
    dumpText.value = data.text || '';
    dumpConversationInfo.textContent = data.conversationInfo || '';
} catch (e) {
    dumpText.value = 'Error: ' + e.message;
}
});

    btnDumpActor.addEventListener('click', async () => {
    try {
    const data = await postJSON('/api/dump-actor', {
    actorId: dumpActorName.value
});
    dumpText.value = data.text || '';
    dumpConversationInfo.textContent = '';
} catch (e) {
    dumpText.value = 'Error: ' + e.message;
}
});
