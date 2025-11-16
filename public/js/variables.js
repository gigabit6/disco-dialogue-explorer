// --- Variables tab search ---
const varSearchInput = document.getElementById('varSearchInput');
const varSearchButton = document.getElementById('varSearchButton');
const varSearchClear = document.getElementById('varSearchClear');
const varResultsBody = document.getElementById('varResultsBody');
const varSearchInfo = document.getElementById('varSearchInfo');

async function fetchVariables(query) {
    const params = query ? ('?q=' + encodeURIComponent(query)) : '';
    const res = await fetch('/api/variables' + params);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
}

function renderVariables(vars) {
    varResultsBody.innerHTML = '';
    if (!vars || vars.length === 0) {
        varResultsBody.innerHTML = `
        <tr><td colspan="3"><em>No variables found.</em></td></tr>
      `;
        return;
    }

    for (const v of vars) {
        const tr = document.createElement('tr');

        tr.innerHTML = `
        <td>${v.id}</td>
        <td>${v.name || ''}</td>
        <td>${v.description || ''}</td>
      `;

        varResultsBody.appendChild(tr);
    }
}

async function doVariableSearch() {
    const q = varSearchInput.value.trim();

    if (q && q.length > 0 && q.length < 2) {
        varSearchInfo.textContent = 'Please type at least 2 characters.';
        return;
    }

    varSearchInfo.textContent = 'Searching...';

    try {
        const vars = await fetchVariables(q);
        renderVariables(vars);
        varSearchInfo.textContent = `Found ${vars.length} variable(s).`;
    } catch (err) {
        console.error('Variable search error', err);
        varSearchInfo.textContent = 'Error searching variables.';
    }
}

varSearchButton.addEventListener('click', doVariableSearch);
varSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doVariableSearch();
});
varSearchClear.addEventListener('click', () => {
    varSearchInput.value = '';
    varSearchInfo.textContent =
        'Type at least 2 characters to search, or leave empty and click Search.';
    varResultsBody.innerHTML = '';
});