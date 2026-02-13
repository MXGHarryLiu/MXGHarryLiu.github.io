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
        var subtitle = this.getAttribute('data-subtitle') || '';
        var subtitleKey = this.getAttribute('data-subtitle-key') || '';
        var hint = this.getAttribute('data-hint') || '';
        var hintKey = this.getAttribute('data-hint-key') || '';
        var hintAuto = this.getAttribute('data-hint-auto') || '';
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
            var resolvedSubtitle = subtitle;
            if (subtitleKey && typeof window.getContent === 'function') {
                resolvedSubtitle = window.getContent(subtitleKey) || resolvedSubtitle;
            }
            var resolvedHint = hint;
            if (hintKey && typeof window.getContent === 'function') {
                resolvedHint = window.getContent(hintKey) || resolvedHint;
            }
            if (!resolvedHint && hintAuto && hintAuto.toLowerCase() === 'click' && typeof window.getContent === 'function') {
                resolvedHint = window.getContent('timeline/clickHint') || resolvedHint;
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
            if (resolvedSubtitle) {
                titleHtml += '<div class="timeline-subtitle">' + resolvedSubtitle + '</div>';
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
            var titleBlock = self.querySelector('.timeline-title');
            var subtitleBlock = self.querySelector('.timeline-subtitle');
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

            var updateSpacing = function () {
                if (!track) {
                    return;
                }
                var titleHeight = titleBlock ? titleBlock.offsetHeight : 0;
                var subtitleHeight = subtitleBlock ? subtitleBlock.offsetHeight : 0;
                if (!titleHeight && !subtitleHeight) {
                    track.style.setProperty('--timeline-padding-top', '20px');
                    return;
                }
                var extra = 12 + titleHeight + subtitleHeight;
                track.style.setProperty('--timeline-padding-top', (20 + extra) + 'px');
            };

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

            var positionCallouts = function () {
                var callouts = Array.prototype.slice.call(self.querySelectorAll('.timeline-callout'));
                if (!callouts.length) {
                    return;
                }

                var parseMid = function (el) {
                    var value = el.style.getPropertyValue('--mid') || '';
                    var num = parseFloat(value.replace('%', ''));
                    return isNaN(num) ? 0 : num;
                };

                callouts.forEach(function (el) {
                    el.style.setProperty('--callout-shift', '0px');
                });

                var shifts = [0, -12, 12, -24, 24, -36, 36, -48, 48, -60, 60];
                var trackRect = track ? track.getBoundingClientRect() : null;
                var fontSizes = [14, 13, 12, 11, 10, 9, 8];

                callouts.sort(function (a, b) {
                    return parseMid(a) - parseMid(b);
                });

                var tryLayout = function (fontSize) {
                    var placed = [];
                    callouts.forEach(function (el) {
                        el.style.setProperty('--callout-font-size', fontSize + 'px');
                        el.style.setProperty('--callout-shift', '0px');
                    });

                    for (var c = 0; c < callouts.length; c++) {
                        var el = callouts[c];
                        var position = '1';
                        var item = el.closest('.timeline-item');
                        if (item && item.getAttribute('data-position')) {
                            position = item.getAttribute('data-position');
                        }
                        var accepted = false;

                        for (var i = 0; i < shifts.length; i++) {
                            el.style.setProperty('--callout-shift', shifts[i] + 'px');
                            var box = el.getBoundingClientRect();
                            if (trackRect && (box.left < trackRect.left || box.right > trackRect.right)) {
                                continue;
                            }
                            var collision = placed.some(function (p) {
                                if (p.position !== position) {
                                    return false;
                                }
                                return box.left < (p.box.right + 6) && box.right > (p.box.left - 6);
                            });
                            if (!collision) {
                                placed.push({ position: position, box: box });
                                accepted = true;
                                break;
                            }
                        }

                        if (!accepted) {
                            return false;
                        }
                    }

                    return true;
                };

                for (var f = 0; f < fontSizes.length; f++) {
                    if (tryLayout(fontSizes[f])) {
                        return;
                    }
                }
            };

            var scheduleLayout = function () {
                if (self._layoutRaf) {
                    cancelAnimationFrame(self._layoutRaf);
                }
                self._layoutRaf = requestAnimationFrame(function () {
                    updateSpacing();
                    positionCallouts();
                });
            };

            if (self._layoutListener) {
                window.removeEventListener('resize', self._layoutListener);
            }
            self._layoutListener = function () {
                scheduleLayout();
            };
            window.addEventListener('resize', self._layoutListener);
            scheduleLayout();
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
        if (this._layoutListener) {
            window.removeEventListener('resize', this._layoutListener);
            this._layoutListener = null;
        }
        if (this._layoutRaf) {
            cancelAnimationFrame(this._layoutRaf);
            this._layoutRaf = null;
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

    getHintElement() {
        return this.querySelector('.timeline-hint');
    }

    setHintVisible(visible) {
        var hint = this.getHintElement();
        if (!hint) {
            return;
        }
        hint.classList.toggle('d-none', !visible);
    }

    showHint() {
        this.setHintVisible(true);
    }

    hideHint() {
        this.setHintVisible(false);
    }
}
customElements.define('timeline-component', Timeline);
