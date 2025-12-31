// score-modifier.js (MAIN world)
// Purpose: run at document_start in the page's MAIN world and override fetch/XHR to
// replace cmi.core.score.raw with 100 when a POST to commit.do is detected.
console.log('score modifier is active');

(function() {
    'use strict';

    function isLikelyJsonString(s) {
        return typeof s === 'string' && /^\s*[\[{]/.test(s);
    }

    function tryParseJson(s) {
        if (!isLikelyJsonString(s)) return null;
        try {
            return JSON.parse(s);
        } catch (e) {
            return null;
        }
    }

    // Override fetch
    const _fetch = window.fetch;
    window.fetch = async function(input, init) {
        try {
            let url = (typeof input === 'string') ? input : (input && input.url);
            let method = (init && init.method) || ((typeof input === 'object' && input.method) || 'GET');
            method = (method || 'GET').toUpperCase();

            if (url && url.includes('commit.do') && method === 'POST') {
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
                            try { input = Object.assign({}, input, { body: newBody }); } catch (e) {}
                        }
                        // Intentionally no chrome.* calls here (MAIN world has no extension APIs)
                        console.log('[EBCrypt] score-modifier modified fetch body for commit.do');
                    }
                }
            }
        } catch (e) {
            console.warn('[EBCrypt] score-modifier fetch override error', e);
        }
        return _fetch.apply(this, arguments);
    };

    // Override XHR
    const _open = XMLHttpRequest.prototype.open;
    const _send = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
        try {
            this._ebcrypt_isCommit = url && url.includes('commit.do') && method && method.toUpperCase() === 'POST';
        } catch (e) {
            this._ebcrypt_isCommit = false;
        }
        return _open.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
        try {
            if (this._ebcrypt_isCommit && body && typeof body === 'string') {
                const parsed = tryParseJson(body);
                if (parsed && typeof parsed === 'object') {
                    parsed['cmi.core.score.raw'] = 100;
                    body = JSON.stringify(parsed);
                    console.log('[EBCrypt] score-modifier modified XHR body for commit.do');
                }
            }
        } catch (e) {
            console.warn('[EBCrypt] score-modifier XHR override error', e);
        }
        return _send.call(this, body);
    };

})();
