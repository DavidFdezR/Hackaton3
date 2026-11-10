/* CalHK mini chart v1.0.0 - tiny bar renderer for the CalHack demo. No network access. */
(function (global) {
    'use strict';
    function render(container, points) {
        while (container.firstChild) container.removeChild(container.firstChild);
        var max = points.reduce(function (m, p) { return Math.max(m, p.value); }, 0) || 1;
        points.forEach(function (p) {
            var bar = document.createElement('div');
            bar.className = 'calhk-bar';
            bar.style.width = Math.round((p.value / max) * 100) + '%';
            bar.textContent = p.label + ': ' + p.value;
            container.appendChild(bar);
        });
    }
    global.CalhkMiniChart = { version: '1.0.0', render: render };
})(typeof window !== 'undefined' ? window : this);
