class Timeline extends HTMLElement {
    connectedCallback() {
        var sourceId = this.getAttribute('data-source');
        if (!sourceId) {
            return;
        }
        var dataScript = document.getElementById(sourceId);
        if (!dataScript) {
            return;
        }
        var items = [];
        try {
            items = JSON.parse(dataScript.textContent || '[]');
        } catch (e) {
            console.error('Invalid timeline data:', e);
            return;
        }
        var title = this.getAttribute('data-title') || '';
        var self = this;
        var render = function () {
            var minValue = null;
            var maxValue = null;
            items.forEach(function (item) {
                var startValue = parseYearMonth(item.start);
                var endValue = parseYearMonth(item.end);
                if (startValue !== null) {
                    minValue = minValue === null ? startValue : Math.min(minValue, startValue);
                }
                if (endValue !== null) {
                    maxValue = maxValue === null ? endValue : Math.max(maxValue, endValue);
                }
            });
            var minOverride = parseYearMonth(self.getAttribute('data-min'));
            var maxOverride = parseYearMonth(self.getAttribute('data-max'));
            if (minOverride !== null) {
                minValue = minOverride;
            }
            if (maxOverride !== null) {
                maxValue = maxOverride;
            }
            if (minValue === null || maxValue === null || maxValue <= minValue) {
                minValue = minValue || 2000;
                maxValue = maxValue || minValue + 1;
            }
            var startTick = Math.ceil(minValue / 5) * 5;
            var endTick = Math.floor(maxValue / 5) * 5;
            var ticks = [];
            for (var y = startTick; y <= endTick; y += 5) {
                ticks.push(y);
            }
            var html = '<div class="timeline-section">' +
                (title ? '<div class="timeline-title">' + title + '</div>' : '') +
                '<div class="timeline-track" data-min="' + minValue + '" data-max="' + maxValue + '">';
            html += '<div class="timeline-ticks">';
            ticks.forEach(function (year) {
                var left = ((year - minValue) / (maxValue - minValue)) * 100;
                html += '<div class="timeline-tick" style="--tick:' + left + '%">' +
                    '<span>' + year + '</span>' +
                '</div>';
            });
            html += '</div>';
            items.forEach(function (item, index) {
                var position = item.position || (index % 2 === 0 ? '1' : '2');
                var label = '';
                if (item.labelKey && typeof window.getContent === 'function') {
                    label = window.getContent(item.labelKey) || '';
                }
                if (!label) {
                    label = item.label || '';
                }
                var href = item.href || '#';
                var startValue = parseYearMonth(item.start);
                var endValue = parseYearMonth(item.end);
                var startPct = ((startValue - minValue) / (maxValue - minValue)) * 100;
                var endPct = ((endValue - minValue) / (maxValue - minValue)) * 100;
                var left = Math.min(startPct, endPct);
                var width = Math.abs(endPct - startPct);
                var midPct = left + width / 2;
                html += '<div class="timeline-item" data-position="' + position + '">' +
                    '<div class="timeline-range" style="--start:' + left + '%; --length:' + width + '%"></div>' +
                    '<div class="timeline-dot" style="--mid:' + midPct + '%"></div>' +
                    '<div class="timeline-callout" style="--mid:' + midPct + '%">' +
                        '<a href="' + href + '">' + label + '</a>' +
                    '</div>' +
                '</div>';
            });
            html += '</div></div>';
            self.innerHTML = html;

            var track = self.querySelector('.timeline-track');
            var updateOrientation = function () {
                if (!track) {
                    return;
                }
                var isVertical = window.matchMedia('(max-width: 768px)').matches;
                track.setAttribute('data-orientation', isVertical ? 'vertical' : 'horizontal');
                if (isVertical) {
                    var fixedHeight = self.getAttribute('data-height');
                    if (fixedHeight) {
                        track.style.height = fixedHeight;
                        track.style.removeProperty('--track-length');
                        return;
                    }
                    var spanYears = maxValue - minValue;
                    var heightPx = Math.max(220, Math.round(spanYears * 18));
                    track.style.setProperty('--track-length', heightPx + 'px');
                    track.style.removeProperty('height');
                } else {
                    track.style.removeProperty('--track-length');
                    track.style.removeProperty('height');
                }
            };
            updateOrientation();
            window.addEventListener('resize', updateOrientation);

            var activationAnimation = (self.getAttribute('data-activate-animation') || '').trim();
            var activationClass = activationAnimation ? ('timeline-activate-' + activationAnimation) : '';
            var setActive = function (activeItem) {
                self.querySelectorAll('.timeline-item').forEach(function (candidate) {
                    candidate.classList.remove('is-active');
                    candidate.classList.remove('is-locked');
                    if (activationClass) {
                        candidate.classList.remove(activationClass);
                    }
                });
                activeItem.classList.add('is-active');
                activeItem.classList.add('is-locked');
                if (activationClass) {
                    activeItem.classList.remove(activationClass);
                    void activeItem.offsetWidth;
                    activeItem.classList.add(activationClass);
                }
            };

            self.querySelectorAll('.timeline-item').forEach(function (item) {
                var callout = item.querySelector('.timeline-callout a');
                if (!callout) {
                    return;
                }
                callout.addEventListener('mouseenter', function () {
                    item.classList.add('is-active');
                });
                callout.addEventListener('mouseleave', function () {
                    if (!item.classList.contains('is-locked')) {
                        item.classList.remove('is-active');
                    }
                });
                callout.addEventListener('focus', function () {
                    item.classList.add('is-active');
                });
                callout.addEventListener('blur', function () {
                    if (!item.classList.contains('is-locked')) {
                        item.classList.remove('is-active');
                    }
                });
                callout.addEventListener('click', function () {
                    setActive(item);
                });
            });
        };
        var parseYearMonth = function (value) {
            if (!value) {
                return null;
            }
            if (typeof value === 'number') {
                return value;
            }
            var parts = String(value).split('-');
            var year = parseInt(parts[0], 10);
            var month = parts.length > 1 ? parseInt(parts[1], 10) : 1;
            if (isNaN(year) || isNaN(month)) {
                return null;
            }
            return year + (month - 1) / 12;
        };

        render();
        if (items.some(function (item) { return item.labelKey; }) && typeof window.getContent !== 'function') {
            document.addEventListener('i18n-ready', render, { once: true });
        }
    }
}
customElements.define('timeline-component', Timeline);
