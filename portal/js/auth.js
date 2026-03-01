// Portal auth guard — checks session + handles magic link verification
(async function portalAuth() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    // If magic link token present, verify it first
    if (token) {
        try {
            const resp = await fetch(`/portal/api/verify?token=${encodeURIComponent(token)}`, {
                credentials: 'same-origin',
            });
            if (!resp.ok) {
                const data = await resp.json().catch(() => ({}));
                alert(data.error || 'Login link is invalid or expired. Please request a new one.');
                window.location.href = '/portal/login';
                return;
            }
            // Remove token from URL (clean up)
            const clean = window.location.pathname;
            window.history.replaceState({}, '', clean);
        } catch (err) {
            alert('Network error during login. Please try again.');
            window.location.href = '/portal/login';
            return;
        }
    }

    // Check if we have a valid session
    try {
        const resp = await fetch('/portal/api/me', { credentials: 'same-origin' });
        if (!resp.ok) {
            window.location.href = '/portal/login';
            return;
        }
        const client = await resp.json();
        window.portalClient = client;
        // Dispatch event so portal.js knows auth is ready
        window.dispatchEvent(new CustomEvent('portal-auth-ready', { detail: client }));
    } catch (err) {
        window.location.href = '/portal/login';
    }
})();
