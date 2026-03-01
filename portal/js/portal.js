// Portal — blog listing, preview, copy, download
window.addEventListener('portal-auth-ready', async (e) => {
    const client = e.detail;

    // Populate nav
    const clientNameEl = document.getElementById('clientName');
    if (clientNameEl) clientNameEl.textContent = client.name;

    // Load posts
    const grid = document.getElementById('postsGrid');
    const loading = document.getElementById('loading');
    const headerTitle = document.getElementById('headerTitle');
    const postCount = document.getElementById('postCount');

    try {
        const resp = await fetch('/portal/api/posts', { credentials: 'same-origin' });
        if (!resp.ok) throw new Error('Failed to load posts');
        const data = await resp.json();

        if (loading) loading.style.display = 'none';
        if (headerTitle) headerTitle.textContent = `${client.name} Blog Posts`;
        if (postCount) postCount.textContent = `${data.count} post${data.count !== 1 ? 's' : ''}`;

        if (!data.posts || data.posts.length === 0) {
            grid.innerHTML = '<div class="empty-state"><p>No blog posts yet. They\'ll appear here once your first batch is ready.</p></div>';
            return;
        }

        grid.innerHTML = data.posts.map(post => `
            <div class="post-card">
                <h3>${escapeHtml(post.title)}</h3>
                <div class="post-meta">
                    <span>${post.size_kb} KB</span>
                    <span>${post.modified}</span>
                </div>
                <div class="post-actions">
                    <button class="btn-action" onclick="previewPost('${escapeAttr(post.filename)}', '${escapeAttr(post.title)}')">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        Preview
                    </button>
                    <button class="btn-action" onclick="copyHtml('${escapeAttr(post.filename)}', this)">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        Copy HTML
                    </button>
                    <a class="btn-action" href="/portal/api/posts/${encodeURIComponent(post.filename)}/download" download>
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Download
                    </a>
                </div>
            </div>
        `).join('');
    } catch (err) {
        if (loading) loading.style.display = 'none';
        grid.innerHTML = '<div class="empty-state"><p>Error loading posts. Please refresh the page.</p></div>';
    }
});

// Preview in modal
function previewPost(filename, title) {
    const overlay = document.getElementById('previewModal');
    const modalTitle = document.getElementById('modalTitle');
    const iframe = document.getElementById('previewFrame');
    modalTitle.textContent = title;
    iframe.src = `/portal/api/posts/${encodeURIComponent(filename)}/preview`;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const overlay = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    overlay.classList.remove('active');
    iframe.src = 'about:blank';
    document.body.style.overflow = '';
}

// Close on overlay click
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('previewModal');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }
});

// Close on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// Copy HTML to clipboard
async function copyHtml(filename, btn) {
    try {
        const resp = await fetch(`/portal/api/posts/${encodeURIComponent(filename)}/raw`, {
            credentials: 'same-origin',
        });
        if (!resp.ok) throw new Error('Failed to fetch');
        const data = await resp.json();
        await navigator.clipboard.writeText(data.html);

        btn.classList.add('copied');
        const origText = btn.innerHTML;
        btn.innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = origText;
        }, 2000);
    } catch (err) {
        alert('Failed to copy. Please try the Download button instead.');
    }
}

// Logout
async function logout() {
    await fetch('/portal/api/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.href = '/portal/login';
}

// Utility
function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}
function escapeAttr(s) {
    return s.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
