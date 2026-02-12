class Timeline extends HTMLElement {
    connectedCallback() {
        this._rangeMode = this._rangeMode || this.getAttribute('data-range-mode') || 'data';
        this._wideRange = this._wideRange || null;
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
        var titleKey = this.getAttribute('data-title-key') || '';
        var hint = this.getAttribute('data-hint') || '';
        var hintKey = this.getAttribute('data-hint-key') || '';
        var toggleTitle = this.getAttribute('data-toggle-title') || '';
        var toggleTitleKey = this.getAttribute('data-toggle-title-key') || '';
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
            self._computedRange = { min: minValue, max: maxValue };
            if (self._rangeMode === 'wide' && self._wideRange) {
                minValue = self._wideRange.min;
                maxValue = self._wideRange.max;
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
            var resolvedTitle = title;
            if (titleKey && typeof window.getContent === 'function') {
                resolvedTitle = window.getContent(titleKey) || resolvedTitle;
            }
            var resolvedHint = hint;
            if (hintKey && typeof window.getContent === 'function') {
                resolvedHint = window.getContent(hintKey) || resolvedHint;
            }
            var resolvedToggleTitle = toggleTitle;
            if (toggleTitleKey && typeof window.getContent === 'function') {
                resolvedToggleTitle = window.getContent(toggleTitleKey) || resolvedToggleTitle;
            }
            var rangeMode = self._rangeMode || self.getAttribute('data-range-mode') || 'data';
            var toggleIcon = rangeMode === 'wide' ? 'fa-link' : 'fa-link-slash';
            var titleHtml = '';
            if (resolvedTitle || resolvedHint) {
                titleHtml = '<div class="timeline-title">' +
                    '<span class="timeline-title-left">' +
                        (resolvedTitle ? '<span class="timeline-title-text">' + resolvedTitle + '</span>' : '') +
                        (resolvedHint ? '<span class="timeline-hint">' + resolvedHint + '</span>' : '') +
                    '</span>' +
                    '<span class="timeline-toggle" title="' + resolvedToggleTitle + '" aria-label="' + resolvedToggleTitle + '">' +
                        '<i class="fa-solid ' + toggleIcon + '"></i>' +
                    '</span>' +
                '</div>';
            }
            var html = '<div class="timeline-section">' +
                titleHtml +
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
            var highlightColor = (self.getAttribute('data-highlight-color') || '').trim();
            if (track && highlightColor) {
                var rgba = null;
                var hex = highlightColor.replace('#', '');
                if (hex.length === 3) {
                    hex = hex.split('').map(function (c) { return c + c; }).join('');
                }
                if (hex.length === 6) {
                    var r = parseInt(hex.slice(0, 2), 16);
                    var g = parseInt(hex.slice(2, 4), 16);
                    var b = parseInt(hex.slice(4, 6), 16);
                    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                        rgba = 'rgba(' + r + ', ' + g + ', ' + b + ', 0.35)';
                        track.style.setProperty('--timeline-highlight-shadow', rgba);
                        track.style.setProperty('--timeline-highlight-shadow-fade', 'rgba(' + r + ', ' + g + ', ' + b + ', 0)');
                    }
                }
                track.style.setProperty('--timeline-highlight', highlightColor);
                track.style.setProperty('--timeline-highlight-strong', highlightColor);
            }

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

        this._render = render;
        render();
        if (!this._i18nListener) {
            this._i18nListener = function () {
                render();
            };
            document.addEventListener('i18n-ready', this._i18nListener);
        }
    }

    disconnectedCallback() {
        if (this._i18nListener) {
            document.removeEventListener('i18n-ready', this._i18nListener);
            this._i18nListener = null;
        }
    }

    setRangeMode(mode) {
        this._rangeMode = mode || 'data';
        this.setAttribute('data-range-mode', this._rangeMode);
        if (this._render) {
            this._render();
        }
    }

    setWideRange(min, max) {
        if (min === null || max === null || typeof min === 'undefined' || typeof max === 'undefined') {
            this._wideRange = null;
        } else {
            this._wideRange = { min: min, max: max };
        }
        if (this._render) {
            this._render();
        }
    }

    getDataRange() {
        return this._computedRange || null;
    }
}
customElements.define('timeline-component', Timeline);
