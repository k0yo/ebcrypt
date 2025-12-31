(function() {
    // MAIN-world script: override window.fetch and XMLHttpRequest early (document_start)
    // This runs in the page's main world and can access the real fetch/XHR objects.

    function isLikelyJsonString(s) {
        return typeof s === 'string' && /^\s*[\[{]/.test(s);
    }

    // Safe JSON parse: only attempt parse for strings that look like JSON
    function tryParseJson(s) {
        if (!isLikelyJsonString(s)) return null;
        try {
            return JSON.parse(s);
        } catch (e) {
            return null;
        }
    }

    // ---- fetch override ----
    const origFetch = window.fetch;
    window.fetch = async function(input, init) {
        try {
            let url = (typeof input === 'string') ? input : (input && input.url);
            let method = (init && init.method) || ((typeof input === 'object' && input.method) || 'GET');
            method = (method || 'GET').toUpperCase();

            if (url && url.includes('commit.do') && method === 'POST') {
                // Determine body string
                let body = null;
                if (init && typeof init.body !== 'undefined') body = init.body;
                else if (typeof input === 'object' && input && typeof input.body !== 'undefined') body = input.body;

                if (typeof body === 'string') {
                    const parsed = tryParseJson(body);
                    if (parsed && typeof parsed === 'object') {
                        parsed['cmi.core.score.raw'] = 100;
                        const newBody = JSON.stringify(parsed);
                        if (init && typeof init.body !== 'undefined') {
                            init.body = newBody;
                        } else if (typeof input === 'object' && input) {
                            // Replace body on the Request-like object
                            try {
                                input = Object.assign({}, input, { body: newBody });
                            } catch (e) {
                                // ignore
                            }
                        }
                        console.log('[EBCrypt] Modified commit.do fetch JSON body');
                    }
                }
            }
        } catch (e) {
            console.warn('[EBCrypt] fetch override error', e);
        }
        return origFetch.apply(this, arguments);
    };

    // ---- XHR override ----
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
        try {
            this._ebcrypt_isCommit = url && url.includes('commit.do') && method && method.toUpperCase() === 'POST';
        } catch (e) {
            this._ebcrypt_isCommit = false;
        }
        return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
        try {
            if (this._ebcrypt_isCommit && body && typeof body === 'string') {
                const parsed = tryParseJson(body);
                if (parsed && typeof parsed === 'object') {
                    parsed['cmi.core.score.raw'] = 100;
                    body = JSON.stringify(parsed);
                    console.log('[EBCrypt] Modified commit.do XHR JSON body');
                }
            }
        } catch (e) {
            console.warn('[EBCrypt] XHR override error', e);
        }
        return origSend.call(this, body);
    };

})();