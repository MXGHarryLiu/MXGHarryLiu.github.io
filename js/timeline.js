function clearTimelineItemSelection(root) {
    if (!root || !root.querySelectorAll) {
        return;
    }
    root.querySelectorAll('.timeline-item').forEach(function (item) {
        item.classList.remove('is-active');
        item.classList.remove('is-locked');
        item.classList.forEach(function (cls) {
            if (cls.indexOf('timeline-activate-') === 0) {
                item.classList.remove(cls);
            }
        });
    });
}

class Timeline extends HTMLElement {
    connectedCallback() {
        if (Timeline.instances) {
            Timeline.instances.add(this);
        }
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
        var self = this;
        var render = function () {
            var title = self.getAttribute('data-title') || '';
            var titleKey = self.getAttribute('data-title-key') || '';
            var subtitle = self.getAttribute('data-subtitle') || '';
            var subtitleKey = self.getAttribute('data-subtitle-key') || '';
            var hint = self.getAttribute('data-hint') || '';
            var hintKey = self.getAttribute('data-hint-key') || '';
            var hintAuto = self.getAttribute('data-hint-auto') || '';
            var toggleTitle = self.getAttribute('data-toggle-title') || '';
            var toggleTitleKey = self.getAttribute('data-toggle-title-key') || '';
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
            if (!resolvedHint && hintAuto && hintAuto.toLowerCase() === 'click') {
                if (typeof window.getContent === 'function') {
                    resolvedHint = window.getContent('timeline/clickHint') || '';
                }
                if (!resolvedHint) {
                    resolvedHint = 'Click item to view details';
                }
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
            if (typeof self._hintVisible === 'boolean') {
                var renderedHint = self.querySelector('.timeline-hint');
                if (renderedHint) {
                    renderedHint.classList.toggle('d-none', !self._hintVisible);
                }
            }

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
            var clearSelection = function () {
                clearTimelineItemSelection(self);
            };
            var setActive = function (activeItem, fireEvent) {
                clearSelection();
                activeItem.classList.add('is-active');
                activeItem.classList.add('is-locked');
                if (activationClass) {
                    activeItem.classList.remove(activationClass);
                    void activeItem.offsetWidth;
                    activeItem.classList.add(activationClass);
                }
                if (fireEvent) {
                    document.dispatchEvent(new CustomEvent('timeline-activate', { detail: { source: self } }));
                }
            };

            var selectByHref = function (href, fireEvent) {
                if (!href) {
                    return false;
                }
                var link = self.querySelector('.timeline-callout a[href="' + href + '"]');
                if (!link) {
                    return false;
                }
                var item = link.closest('.timeline-item');
                if (!item) {
                    return false;
                }
                self._activeHref = href;
                setActive(item, !!fireEvent);
                return true;
            };
            self._selectByHref = selectByHref;

            self.querySelectorAll('.timeline-item').forEach(function (item) {
                var callout = item.querySelector('.timeline-callout a');
                var dot = item.querySelector('.timeline-dot');
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
                    self._activeHref = callout.getAttribute('href') || '';
                    setActive(item, true);
                });
                if (dot) {
                    dot.addEventListener('mouseenter', function () {
                        item.classList.add('is-active');
                    });
                    dot.addEventListener('mouseleave', function () {
                        if (!item.classList.contains('is-locked')) {
                            item.classList.remove('is-active');
                        }
                    });
                }
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

            if (self._activeHref) {
                selectByHref(self._activeHref);
            }
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
        if (!this._externalActivateListener) {
            this._externalActivateListener = function (event) {
                if (!event || !event.detail || event.detail.source === this) {
                    return;
                }
                this._activeHref = '';
                clearTimelineItemSelection(this);
            }.bind(this);
            document.addEventListener('timeline-activate', this._externalActivateListener);
        }
    }

    disconnectedCallback() {
        if (Timeline.instances) {
            Timeline.instances.delete(this);
        }
        if (this._i18nListener) {
            document.removeEventListener('i18n-ready', this._i18nListener);
            this._i18nListener = null;
        }
        if (this._externalActivateListener) {
            document.removeEventListener('timeline-activate', this._externalActivateListener);
            this._externalActivateListener = null;
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

    clearSelection() {
        if (!this._render) {
            return;
        }
        this._activeHref = '';
        clearTimelineItemSelection(this);
    }

    selectByHref(href, options) {
        if (!this._render) {
            return false;
        }
        var fireEvent = !!(options && options.fireEvent);
        if (typeof this._selectByHref === 'function') {
            return this._selectByHref(href, fireEvent);
        }
        return false;
    }

    activateByHref(href, options) {
        return this.selectByHref(href, options);
    }

    hasSelection() {
        if (this._activeHref) {
            return true;
        }
        return !!this.querySelector('.timeline-item.is-locked');
    }

    /**
     * @param {boolean} visible
     */
    setHintVisible(visible) {
        this._hintVisible = !!visible;
        var hint = this.#getHintElement();
        if (!hint) {
            return;
        }
        hint.classList.toggle('d-none', !this._hintVisible);
    }

    #getHintElement() {
        return this.querySelector('.timeline-hint');
    }

    setHintAuto(mode) {
        if (mode) {
            this.setAttribute('data-hint-auto', mode);
        } else {
            this.removeAttribute('data-hint-auto');
        }
        if (this._render) {
            this._render();
        }
    }

}
customElements.define('timeline-component', Timeline);
Timeline.instances = new Set();

class TimelineManager {
    constructor(options) {
        this._selectors = (options && options.selectors) ? options.selectors.slice() : [];
        this._wideQuery = (options && options.wideQuery) ? options.wideQuery : '(min-width: 960px)';
        this._toggleSelector = (options && options.toggleSelector) ? options.toggleSelector : '.timeline-toggle';
        this._hintAuto = (options && typeof options.hintAuto !== 'undefined') ? options.hintAuto : 'click';
        this._hintFirst = !(options && options.hintFirst === false);
        this._cardSelector = (options && options.cardSelector) ? options.cardSelector : '';
        this._manageCardNavigation = !!this._cardSelector;
        this._cards = [];
        this._timelines = [];
        this._wideMedia = null;
        this._primaryTimeline = null;
        this._boundToggleHandler = this.#handleToggleClick.bind(this);
        this._boundTimelineClickHandler = this.#handleTimelineClick.bind(this);
        this._boundActivateHandler = this.#handleTimelineActivate.bind(this);
        this._boundHashChangeHandler = this.#handleHashChange.bind(this);
        this._boundDocumentLinkHandler = this.#handleDocumentHashLinkClick.bind(this);
        this._boundSyncHandler = this.syncMode.bind(this);
        this._boundHintHandler = this.#applyHintDefaults.bind(this);
    }

    #resolveTimelines() {
        var instances = Timeline.instances ? Array.from(Timeline.instances) : [];
        if (!this._selectors.length) {
            this._timelines = instances;
            this._primaryTimeline = this._timelines.length ? this._timelines[0] : null;
            return;
        }
        this._timelines = instances.filter(function (timeline) {
            return this._selectors.some(function (selector) {
                return timeline.matches(selector);
            });
        }, this);
        this._primaryTimeline = this._timelines.length ? this._timelines[0] : null;
    }

    #computeWideRange() {
        if (!this._timelines.length) {
            return null;
        }
        var min = null;
        var max = null;
        this._timelines.forEach(function (timeline) {
            var range = timeline.getDataRange ? timeline.getDataRange() : null;
            if (!range || range.min === null || range.max === null) {
                return;
            }
            min = min === null ? range.min : Math.min(min, range.min);
            max = max === null ? range.max : Math.max(max, range.max);
        });
        if (min === null || max === null) {
            return null;
        }
        return { min: min, max: max };
    }

    #applyWide() {
        var wideRange = this.#computeWideRange();
        if (!wideRange) {
            return;
        }
        this._timelines.forEach(function (timeline) {
            if (timeline.setWideRange) {
                timeline.setWideRange(wideRange.min, wideRange.max);
            }
            if (timeline.setRangeMode) {
                timeline.setRangeMode('wide');
            }
        });
    }

    #applyData() {
        this._timelines.forEach(function (timeline) {
            if (timeline.setRangeMode) {
                timeline.setRangeMode('data');
            }
        });
    }

    #hasAnySelection() {
        return this._timelines.some(function (timeline) {
            if (!timeline) {
                return false;
            }
            if (typeof timeline.hasSelection === 'function') {
                return timeline.hasSelection();
            }
            return !!timeline.querySelector('.timeline-item.is-locked');
        });
    }

    #hidePrimaryHint() {
        if (this._primaryTimeline && this._primaryTimeline.setHintVisible) {
            this._primaryTimeline.setHintVisible(false);
        }
    }

    #setPrimaryHintVisible(visible) {
        if (this._primaryTimeline && this._primaryTimeline.setHintVisible) {
            this._primaryTimeline.setHintVisible(visible);
        }
    }

    #resolveCards() {
        if (!this._manageCardNavigation) {
            this._cards = [];
            return;
        }
        this._cards = Array.prototype.slice.call(document.querySelectorAll(this._cardSelector));
    }

    #isManagedCard(target) {
        if (!target || !this._manageCardNavigation) {
            return false;
        }
        if (!this._cards.length) {
            return false;
        }
        return this._cards.indexOf(target) !== -1;
    }

    #hideAllCards() {
        if (!this._cards.length) {
            return;
        }
        this._cards.forEach(function (card) {
            card.classList.add('d-none');
        });
    }

    #clearTimelineSelection(timeline) {
        if (!timeline) {
            return;
        }
        if (typeof timeline.clearSelection === 'function') {
            timeline.clearSelection();
            return;
        }
        clearTimelineItemSelection(timeline);
    }

    #activateTimelineCallout(id) {
        if (!id) {
            return;
        }
        this._timelines.forEach(function (timeline) {
            if (typeof timeline.selectByHref === 'function') {
                timeline.selectByHref('#' + id);
                return;
            }
            if (typeof timeline.activateByHref === 'function') {
                timeline.activateByHref('#' + id);
                return;
            }
            var link = timeline.querySelector('.timeline-callout a[href="#' + id + '"]');
            if (link) {
                link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            }
        });
    }

    #showManagedCard(id, options) {
        if (!this._manageCardNavigation) {
            return false;
        }
        var target = document.getElementById(id);
        if (!this.#isManagedCard(target)) {
            return false;
        }
        var shouldScroll = !(options && options.scroll === false);
        var shouldUpdateHash = !(options && options.updateHash === false);
        this.#hideAllCards();
        target.classList.remove('d-none');
        this.#hidePrimaryHint();
        this.#activateTimelineCallout(id);
        if (shouldScroll) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (shouldUpdateHash) {
            if (history && history.replaceState) {
                history.replaceState(null, '', '#' + id);
            } else {
                location.hash = '#' + id;
            }
        }
        return true;
    }

    #applyHintDefaults() {
        if (!this._hintFirst || !this._timelines.length) {
            return;
        }
        var hasSelection = this.#hasAnySelection();
        this._timelines.forEach(function (timeline, index) {
            var explicitHint = !!timeline.getAttribute('data-hint') || !!timeline.getAttribute('data-hint-key');
            if (index === 0 && !explicitHint && this._hintAuto) {
                if (timeline.setHintAuto) {
                    timeline.setHintAuto(this._hintAuto);
                } else {
                    timeline.setAttribute('data-hint-auto', this._hintAuto);
                }
            } else if (!explicitHint && timeline.getAttribute('data-hint-auto')) {
                if (timeline.setHintAuto) {
                    timeline.setHintAuto('');
                } else {
                    timeline.removeAttribute('data-hint-auto');
                }
            }
            if (timeline.setHintVisible) {
                timeline.setHintVisible(index === 0 && !hasSelection);
            }
        }, this);
    }

    #handleTimelineClick(event) {
        var link = event.target.closest('.timeline-callout a');
        if (!link) {
            return;
        }
        var href = link.getAttribute('href') || '';
        if (this._manageCardNavigation && href.charAt(0) === '#') {
            var targetId = href.slice(1);
            event.preventDefault();
            this._timelines.forEach(function (other) {
                if (!other.contains(link)) {
                    this.#clearTimelineSelection(other);
                }
            }, this);
            this.#showManagedCard(targetId);
            return;
        }
        this.#hidePrimaryHint();
    }

    #handleTimelineActivate(event) {
        if (!event || !event.detail || !event.detail.source) {
            return;
        }
        if (this._timelines.indexOf(event.detail.source) === -1) {
            return;
        }
        this.#hidePrimaryHint();
    }

    #handleToggleClick(event) {
        if (!event.target.closest(this._toggleSelector)) {
            return;
        }
        var currentMode = null;
        if (this._timelines.length) {
            currentMode = this._timelines[0].getAttribute('data-range-mode') || 'data';
        }
        var nextMode = currentMode === 'wide' ? 'data' : 'wide';
        this.setRangeMode(nextMode);
    }

    #handleHashChange() {
        if (!this._manageCardNavigation) {
            return;
        }
        var nextId = location.hash ? location.hash.replace('#', '') : '';
        if (!nextId) {
            this.#hideAllCards();
            this.#setPrimaryHintVisible(true);
            return;
        }
        this.#showManagedCard(nextId, { scroll: false, updateHash: false });
    }

    #handleDocumentHashLinkClick(event) {
        if (!this._manageCardNavigation) {
            return;
        }
        var link = event.target.closest('a');
        if (!link) {
            return;
        }
        if (link.closest('timeline-component')) {
            return;
        }
        var href = link.getAttribute('href') || '';
        if (href.charAt(0) !== '#') {
            return;
        }
        var targetId = href.slice(1);
        if (!targetId) {
            return;
        }
        var target = document.getElementById(targetId);
        if (!this.#isManagedCard(target)) {
            return;
        }
        event.preventDefault();
        this.#showManagedCard(targetId);
    }

    init() {
        this.#resolveTimelines();
        if (!this._timelines.length) {
            return;
        }
        this.#resolveCards();
        this.#applyHintDefaults();
        var self = this;
        this._timelines.forEach(function (timeline) {
            timeline.addEventListener('click', self._boundToggleHandler);
            timeline.addEventListener('click', self._boundTimelineClickHandler);
        });
        document.addEventListener('timeline-activate', this._boundActivateHandler);
        this._wideMedia = window.matchMedia(this._wideQuery);
        this.syncMode();
        document.addEventListener('i18n-ready', this._boundHintHandler);
        if (this._wideMedia.addEventListener) {
            this._wideMedia.addEventListener('change', this._boundSyncHandler);
        } else if (this._wideMedia.addListener) {
            this._wideMedia.addListener(this._boundSyncHandler);
        }
        document.addEventListener('i18n-ready', this._boundSyncHandler);

        if (this._manageCardNavigation && this._cards.length) {
            this.#hideAllCards();
            var initialId = location.hash ? location.hash.replace('#', '') : '';
            if (initialId) {
                this.#showManagedCard(initialId, { scroll: false });
            } else {
                this.#setPrimaryHintVisible(true);
            }
            window.addEventListener('hashchange', this._boundHashChangeHandler);
            document.addEventListener('click', this._boundDocumentLinkHandler);
        }
    }

    destroy() {
        var self = this;
        this._timelines.forEach(function (timeline) {
            timeline.removeEventListener('click', self._boundToggleHandler);
            timeline.removeEventListener('click', self._boundTimelineClickHandler);
        });
        document.removeEventListener('timeline-activate', this._boundActivateHandler);
        if (this._wideMedia) {
            if (this._wideMedia.removeEventListener) {
                this._wideMedia.removeEventListener('change', this._boundSyncHandler);
            } else if (this._wideMedia.removeListener) {
                this._wideMedia.removeListener(this._boundSyncHandler);
            }
        }
        document.removeEventListener('i18n-ready', this._boundHintHandler);
        document.removeEventListener('i18n-ready', this._boundSyncHandler);
        if (this._manageCardNavigation) {
            window.removeEventListener('hashchange', this._boundHashChangeHandler);
            document.removeEventListener('click', this._boundDocumentLinkHandler);
        }
        this._timelines = [];
        this._primaryTimeline = null;
        this._cards = [];
    }

    syncMode() {
        if (this._wideMedia && this._wideMedia.matches) {
            this.#applyWide();
        } else {
            this.#applyData();
        }
    }

    setRangeMode(mode) {
        if (mode === 'wide') {
            this.#applyWide();
        } else {
            this.#applyData();
        }
    }

    setWideRange(min, max) {
        this._timelines.forEach(function (timeline) {
            if (timeline.setWideRange) {
                timeline.setWideRange(min, max);
            }
            if (timeline.setRangeMode) {
                timeline.setRangeMode('wide');
            }
        });
    }

    refresh() {
        this.#resolveTimelines();
        this.#resolveCards();
        this.#applyHintDefaults();
        this.syncMode();
    }
}

window.TimelineManager = TimelineManager;
