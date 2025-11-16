fetch('/api/actors')
    .then(res => {
        if (!res.ok) {
            throw new Error('Failed to load actors');
        }
        return res.json();
    })
    .then(actors => {
        const select = document.getElementById('searchActorName');
        const dump = document.getElementById('dumpActorName');

        actors.forEach(actor => {
            const opt = document.createElement('option');
            opt.value = actor.id; // same as before
            opt.textContent = `${actor.name} (${actor.line_count} lines)`;
            select.appendChild(opt);
            dump.appendChild(opt.cloneNode(true));
        });
    })
    .catch(err => {
        console.error(err);
    });