/* eslint-disable-next-line no-unused-expressions -- Aura bundles are a bare object literal */
({
    // Keep in sync with c/calhkAllowlist TRUSTED_HOSTS (checked by the Jasmine spec).
    TRUSTED_HOSTS: ['calhk-demo.my.salesforce.com', 'calhk-demo.lightning.force.com', 'docs.calhk-demo.example', 'billing.calhk-demo.example'],

    parse: function (raw) {
        var m = /^([a-z][a-z0-9+.-]*):(?:\/\/([^/?#:]+))?/i.exec(String(raw || '').trim());
        return m ? { scheme: m[1].toLowerCase(), host: (m[2] || '').toLowerCase() } : null;
    },

    isTrusted: function (raw) {
        var u = this.parse(raw);
        return !!u && u.scheme === 'https' && this.TRUSTED_HOSTS.indexOf(u.host) !== -1;
    },

    describe: function (raw) {
        var u = this.parse(raw);
        if (!u) {
            return 'invalid link';
        }
        if (u.scheme !== 'https') {
            return u.scheme + ' link';
        }
        return u.host;
    },

    toSegments: function (reply) {
        var text = typeof reply === 'string' ? reply : '';
        var re = /!\[([^\]]*)\]\(([^)\s]*)\)|\[([^\]]+)\]\(([^)\s]*)\)/g;
        var segments = [];
        var last = 0;
        var match;
        var pushText = function (value) {
            if (value) {
                segments.push({ isText: true, text: value });
            }
        };
        while ((match = re.exec(text)) !== null) {
            pushText(text.slice(last, match.index));
            last = re.lastIndex;
            if (match[0].charAt(0) === '!') {
                if (this.isTrusted(match[2])) {
                    segments.push({ isImage: true, src: match[2], label: match[1] || 'image' });
                } else {
                    pushText('[image not loaded: ' + this.describe(match[2]) + ']');
                }
            } else if (this.isTrusted(match[4])) {
                segments.push({ isLink: true, href: match[4], label: match[3], host: this.parse(match[4]).host });
            } else {
                pushText(match[3] + ' [link not opened: ' + this.describe(match[4]) + ']');
            }
        }
        pushText(text.slice(last));
        return segments;
    },

    formatReply: function (component) {
        component.set('v.segments', this.toSegments(component.get('v.reply')));
    }
})
