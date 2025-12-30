(function() {
    'use strict';

    function tryModifyJsonString(s) {
        try {
            const obj = JSON.parse(s);
            obj['cmi.core.score.raw'] = 100;
            return JSON.stringify(obj);
        } catch (e) {
            return s;
        }
    }

    function tryModifyBody(body) {
        // Handle strings (JSON), URLSearchParams, FormData
        if (typeof body === 'string') {
            return tryModifyJsonString(body);
        }
        if (body instanceof URLSearchParams) {
            body.set('cmi.core.score.raw', '100');
            return body.toString();
        }
        if (body instanceof FormData) {
            body.set('cmi.core.score.raw', '100');
            return body; // FormData can be used directly
        }
        // If it's a Request, attempt to clone and modify (handled in fetch wrapper)
        return body;
    }

    // Intercept fetch
    const origFetch = window.fetch;
    window.fetch = function(input, init) {
        try {
            const url = (typeof input === 'string') ? input : input && input.url;
            const method = (init && init.method) || (input && input.method) || 'GET';
            if (url && url.includes('commit.do') && method.toUpperCase() === 'POST') {
                init = init || {};
                if (init.body) {
                    init.body = tryModifyBody(init.body);
                    console.log('[EBCrypt] Modified commit.do fetch request (init.body)');
                } else if (input instanceof Request) {
                    try {
                        const cloned = input.clone();
                        return cloned.text().then(text => {
                            const newBody = tryModifyBody(text);
                            const newReq = new Request(cloned, { body: newBody });
                            console.log('[EBCrypt] Modified commit.do fetch request (Request)');
                            return origFetch.call(this, newReq);
                        });
                    } catch (e) {
                        // continue with original if cloning failed
                    }
                }
            }
        } catch (e) {
            // ignore
        }
        return origFetch.apply(this, arguments);
    };

    // Intercept XMLHttpRequest
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
        try {
            this._ebcrypt_isCommit = url && url.includes('commit.do') && method && method.toUpperCase() === 'POST';
        } catch (e) {}
        return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function(body) {
        try {
            if (this._ebcrypt_isCommit && body) {
                if (typeof body === 'string') {
                    body = tryModifyJsonString(body);
                    console.log('[EBCrypt] Modified commit.do XHR request (string)');
                } else if (body instanceof URLSearchParams) {
                    body.set('cmi.core.score.raw', '100');
                    body = body.toString();
                    console.log('[EBCrypt] Modified commit.do XHR request (URLSearchParams)');
                } else if (body instanceof FormData) {
                    body.set('cmi.core.score.raw', '100');
                    console.log('[EBCrypt] Modified commit.do XHR request (FormData)');
                }
            }
        } catch (e) {
            // ignore
        }
        return origSend.call(this, body);
    };

    // Intercept sendBeacon
    if (navigator && typeof navigator.sendBeacon === 'function') {
        const origBeacon = navigator.sendBeacon;
        navigator.sendBeacon = function(url, data) {
            try {
                if (url && url.includes('commit.do')) {
                    if (typeof data === 'string') {
                        data = tryModifyJsonString(data);
                        console.log('[EBCrypt] Modified commit.do sendBeacon (string)');
                    } else if (data instanceof URLSearchParams) {
                        data.set('cmi.core.score.raw', '100');
                        data = data.toString();
                        console.log('[EBCrypt] Modified commit.do sendBeacon (URLSearchParams)');
                    } else if (data instanceof FormData) {
                        data.set('cmi.core.score.raw', '100');
                        console.log('[EBCrypt] Modified commit.do sendBeacon (FormData)');
                    }
                }
            } catch (e) {}
            return origBeacon.call(this, url, data);
        };
    }

    console.log('[EBCrypt] commit_interceptor initialized at document_start');
})();