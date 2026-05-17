(function () {
    function getColorByType(type) {
        switch (type) {
            case "home":
                return "#ff1e00";
            case "sojourn":
                return "#fff500";
            case "layover":
                return "#3b82f6";
            default:
                return "#4bd8b5";
        }
    }

    function hasPhotoFlag(row) {
        var v = row && row.hasPhoto;
        return v === '1' || v === 'true' || v === true;
    }

    function getMarkerSize(row) {
        return hasPhotoFlag(row) ? 14 : 10;
    }

    var CONTINENT_BY_COUNTRY = {
        us: 'NA', ca: 'NA', mx: 'NA',
        ar: 'SA', br: 'SA', cl: 'SA', co: 'SA', pe: 'SA',
        gb: 'EU', ie: 'EU', fr: 'EU', de: 'EU', es: 'EU', pt: 'EU', it: 'EU', va: 'EU',
        ch: 'EU', at: 'EU', be: 'EU', nl: 'EU', lu: 'EU', dk: 'EU', se: 'EU', no: 'EU',
        fi: 'EU', is: 'EU', pl: 'EU', cz: 'EU', sk: 'EU', hu: 'EU', ro: 'EU', bg: 'EU',
        gr: 'EU', hr: 'EU', si: 'EU', rs: 'EU', tr: 'EU', ua: 'EU', ru: 'EU',
        cn: 'AS', hk: 'AS', mo: 'AS', tw: 'AS', jp: 'AS', kr: 'AS', kp: 'AS', mn: 'AS',
        sg: 'AS', my: 'AS', th: 'AS', kh: 'AS', vn: 'AS', la: 'AS', mm: 'AS', ph: 'AS',
        id: 'AS', bn: 'AS', tl: 'AS', in: 'AS', pk: 'AS', bd: 'AS', np: 'AS', lk: 'AS',
        mv: 'AS', bt: 'AS', af: 'AS', ir: 'AS', iq: 'AS', sy: 'AS', lb: 'AS', il: 'AS',
        ps: 'AS', jo: 'AS', sa: 'AS', ae: 'AS', om: 'AS', ye: 'AS', qa: 'AS', bh: 'AS',
        kw: 'AS', kz: 'AS', uz: 'AS', tm: 'AS', kg: 'AS', tj: 'AS', am: 'AS', az: 'AS', ge: 'AS',
        eg: 'AF', ma: 'AF', dz: 'AF', tn: 'AF', ly: 'AF', sd: 'AF', et: 'AF', ke: 'AF',
        ng: 'AF', za: 'AF', gh: 'AF', tz: 'AF', ug: 'AF', sn: 'AF', ci: 'AF',
        au: 'OC', nz: 'OC', fj: 'OC', pg: 'OC'
    };

    function getLocalizedLegendName(type) {
        if (!window.i18nManager || typeof window.i18nManager.getContent !== "function") {
            return type;
        }
        return window.i18nManager.getContent("places/legend/" + type, type);
    }

    window.initPlacesMap = function (options) {
        var opts = options || {};
        var mapId = opts.mapId || "plotly-map";
        var hintId = opts.hintId || "plotly-map-hint";
        var csvUrl = opts.csvUrl || "data/map.csv";
        var onPlaceClick = opts.onPlaceClick;

        if (!window.d3 || !window.Plotly) return null;

        var mapDiv = document.getElementById(mapId);
        if (!mapDiv) return null;
        var getAppliedTheme = function () {
            var theme = document.documentElement.getAttribute("data-bs-theme");
            return theme === "dark" ? "dark" : "light";
        };
        function getMapThemeConfig() {
            if (getAppliedTheme() === "dark") {
                return {
                    style: "carto-darkmatter",
                    legendFontColor: "#e2e8f0",
                    backgroundColor: "#000000"
                };
            }
            return {
                style: "carto-positron",
                legendFontColor: "#1f2937",
                backgroundColor: "#ffffff"
            };
        }

        var hintEl = document.getElementById(hintId);
        function hideHint() {
            if (!hintEl) return;
            hintEl.classList.add("is-hidden");
        }
        setTimeout(hideHint, 10000);

        var readyCallbacks = [];
        var countryByRowIndex = {};
        var stateByRowIndex = {};
        var hasPhotoByRowIndex = {};
        var api = {
            selectPlace: function () {},
            getCountryByRowIndex: function (rowIndex) {
                return countryByRowIndex[rowIndex] || '';
            },
            hasPhoto: function (rowIndex) {
                return hasPhotoByRowIndex[rowIndex] === true;
            },
            getStats: function () {
                var countries = {};
                var continents = {};
                var usStates = {};
                Object.keys(countryByRowIndex).forEach(function (idx) {
                    var c = countryByRowIndex[idx];
                    if (!c) return;
                    countries[c] = true;
                    var cont = CONTINENT_BY_COUNTRY[c];
                    if (cont) continents[cont] = true;
                    var s = stateByRowIndex[idx];
                    if (c === 'us' && s) usStates[s] = true;
                });
                return {
                    countryCount: Object.keys(countries).length,
                    continentCount: Object.keys(continents).length,
                    usStateCount: Object.keys(usStates).length
                };
            },
            onReady: function (cb) {
                if (typeof cb !== 'function') return;
                if (api._ready) {
                    cb();
                } else {
                    readyCallbacks.push(cb);
                }
            }
        };
        window.placeMapSync = api;

        d3.csv(csvUrl, function (err, rows) {
            if (err || !rows || !rows.length) return;

            rows.forEach(function (row, idx) {
                countryByRowIndex[idx] = (row.country || '').toLowerCase();
                stateByRowIndex[idx] = (row.state || '').toUpperCase();
                hasPhotoByRowIndex[idx] = hasPhotoFlag(row);
            });
            api._ready = true;
            readyCallbacks.splice(0).forEach(function (cb) {
                try { cb(); } catch (e) {}
            });

            var typeArray = rows.map(function (row) { return row.type; });
            var types = [];
            typeArray.forEach(function (type) {
                if (types.indexOf(type) < 0) {
                    types.push(type);
                }
            });

            function getRowLabel(row) {
                var locale = window.i18nManager ? window.i18nManager.currentLocale : 'en-US';
                if (locale !== 'en-US' && row[locale]) return row[locale];
                return row['en-US'] || row['label'] || '';
            }

            var rowIndexByKey = {};
            rows.forEach(function (row, idx) {
                rowIndexByKey[row['en-US'] || row['label']] = idx;
            });

            function unpack(list, key) {
                return list.map(function (row) { return row[key]; });
            }

            function applyLocalizedLegendNames() {
                types.forEach(function (type, idx) {
                    try {
                        var restyleResult = Plotly.restyle(mapId, { name: getLocalizedLegendName(type) }, [idx]);
                        if (restyleResult && typeof restyleResult.catch === "function") {
                            restyleResult.catch(function () {
                                queueLegendUpdate();
                                scheduleMapReadyPoll();
                            });
                        }
                    } catch (error) {
                        queueLegendUpdate();
                        scheduleMapReadyPoll();
                    }
                });
            }

            var data = types.map(function (type) {
                var rowsFiltered = rows.filter(function (row) {
                    return row.type === type;
                });
                return {
                    type: "scattermap",
                    name: getLocalizedLegendName(type),
                    lat: unpack(rowsFiltered, "lat"),
                    lon: unpack(rowsFiltered, "lon"),
                    text: rowsFiltered.map(getRowLabel),
                    customdata: rowsFiltered.map(function (row) {
                        return rowIndexByKey[row['en-US'] || row['label']];
                    }),
                    hovertemplate: "%{text}<extra></extra>",
                    marker: {
                        size: rowsFiltered.map(function (row) { return getMarkerSize(row); }),
                        color: getColorByType(type),
                        opacity: unpack(rowsFiltered, "label").map(function () { return 0.45; })
                    }
                };
            });

            var pointRefByRowIndex = {};
            data.forEach(function (trace, curveNumber) {
                trace.customdata.forEach(function (rowIndex, pointNumber) {
                    pointRefByRowIndex[rowIndex] = {
                        curveNumber: curveNumber,
                        pointNumber: pointNumber
                    };
                });
            });

            var layout = {
                map: {
                    style: getMapThemeConfig().style,
                    center: { lat: 38.03, lon: -90.70 },
                    zoom: 0
                },
                margin: { l: 0, r: 0, t: 0, b: 0, pad: 5 },
                showlegend: true,
                legend: {
                    x: 0,
                    xanchor: "left",
                    y: 0,
                    yanchor: "bottom",
                    orientation: "h",
                    font: { color: getMapThemeConfig().legendFontColor }
                },
                paper_bgcolor: getMapThemeConfig().backgroundColor,
                plot_bgcolor: getMapThemeConfig().backgroundColor
            };

            var config = {
                responsive: true,
                displaylogo: false,
                showTips: false,
                modeBarButtonsToRemove: ["lasso2d", "select2d"]
            };

            var selectedPlaceIndex = 0;
            var themeApplyTimer = null;
            var maxThemeApplyRetries = 8;
            var selectionApplyTimer = null;
            var maxSelectionApplyRetries = 8;
            var legendApplyTimer = null;
            var mapIsReady = false;
            var mapStyleTransitioning = false;
            var pendingSelection = null;
            var pendingLegendUpdate = false;
            var mapReadyPollTimer = null;

            function getUnderlyingMapInstance() {
                try {
                    var fullLayout = mapDiv && mapDiv._fullLayout;
                    if (!fullLayout || !fullLayout.map || !fullLayout.map._subplot) {
                        return null;
                    }
                    var subplot = fullLayout.map._subplot;
                    return subplot.map || subplot._map || null;
                } catch (error) {
                    return null;
                }
            }

            function isUnderlyingMapStyleLoaded() {
                var mapInstance = getUnderlyingMapInstance();
                if (!mapInstance) {
                    return false;
                }
                if (typeof mapInstance.isStyleLoaded === "function") {
                    return !!mapInstance.isStyleLoaded();
                }
                if (typeof mapInstance.loaded === "function") {
                    return !!mapInstance.loaded();
                }
                return true;
            }

            function isMapMutationReady() {
                return mapIsReady && !mapStyleTransitioning && isUnderlyingMapStyleLoaded();
            }

            function compactMapAttribution() {
                var controls = mapDiv.querySelectorAll(".mapboxgl-ctrl-attrib, .maplibregl-ctrl-attrib");
                controls.forEach(function (control) {
                    control.classList.add("mapboxgl-compact", "maplibregl-compact");
                    control.classList.remove("mapboxgl-compact-show", "maplibregl-compact-show");
                    var button = control.querySelector(".mapboxgl-ctrl-attrib-button, .maplibregl-ctrl-attrib-button");
                    if (button) {
                        button.setAttribute("aria-expanded", "false");
                    }
                });
            }

            function getControlLabel(key, fallback) {
                if (!window.i18nManager || typeof window.i18nManager.getContent !== "function") {
                    return fallback;
                }
                return window.i18nManager.getContent("places/controls/" + key, fallback);
            }

            function setControlTooltip(element, label) {
                if (!element || !label) return;
                element.removeAttribute("title");
                element.setAttribute("aria-label", label);
                element.setAttribute("data-title", label);
            }

            function localizeMapControls() {
                var modebarFallbackLabels = {
                    download: "Download plot as PNG",
                    pan: "Pan",
                    zoomIn: "Zoom in",
                    zoomOut: "Zoom out",
                    reset: "Reset view"
                };
                var modebarIconKeys = {
                    "icon-camera-retro": "download",
                    "icon-pan": "pan",
                    "icon-zoom-in": "zoomIn",
                    "icon-zoom-plus": "zoomIn",
                    "icon-zoom-out": "zoomOut",
                    "icon-zoom-minus": "zoomOut",
                    "icon-home": "reset"
                };

                [
                    [".mapboxgl-ctrl-zoom-in, .maplibregl-ctrl-zoom-in", "zoomIn", "Zoom in"],
                    [".mapboxgl-ctrl-zoom-out, .maplibregl-ctrl-zoom-out", "zoomOut", "Zoom out"],
                    [".mapboxgl-ctrl-attrib-button, .maplibregl-ctrl-attrib-button", "attribution", "Map attribution"]
                ].forEach(function (item) {
                    var label = getControlLabel(item[1], item[2]);
                    mapDiv.querySelectorAll(item[0]).forEach(function (element) {
                        setControlTooltip(element, label);
                    });
                });

                var modebarButtons = Array.prototype.slice.call(mapDiv.querySelectorAll(".modebar-btn"));
                var fiveButtonOrder = ["download", "zoomIn", "zoomOut", "pan", "reset"];
                modebarButtons.forEach(function (element, index) {
                    var controlKey = element.getAttribute("data-i18n-control");
                    var currentLabel = element.getAttribute("data-title") || element.getAttribute("title") || element.getAttribute("aria-label") || "";
                    if (!controlKey) {
                        controlKey = getModebarControlKey(element, currentLabel);
                        if (controlKey) {
                            element.setAttribute("data-i18n-control", controlKey);
                        }
                    }
                    if (!controlKey) {
                        Object.keys(modebarIconKeys).some(function (iconClass) {
                            if (!element.querySelector("." + iconClass)) return false;
                            controlKey = modebarIconKeys[iconClass];
                            element.setAttribute("data-i18n-control", controlKey);
                            return true;
                        });
                    }
                    if (!controlKey && modebarButtons.length === fiveButtonOrder.length) {
                        controlKey = fiveButtonOrder[index];
                        element.setAttribute("data-i18n-control", controlKey);
                    }
                    if (!controlKey) return;
                    setControlTooltip(element, getControlLabel(controlKey, modebarFallbackLabels[controlKey]));
                });
            }

            function getModebarControlKey(element, label) {
                var normalizedLabel = (label || "").toLowerCase();
                if (normalizedLabel.indexOf("download") >= 0 || normalizedLabel.indexOf("png") >= 0) return "download";
                if (normalizedLabel.indexOf("zoom in") >= 0 || normalizedLabel.indexOf("zoom-in") >= 0) return "zoomIn";
                if (normalizedLabel.indexOf("zoom out") >= 0 || normalizedLabel.indexOf("zoom-out") >= 0) return "zoomOut";
                if (normalizedLabel === "pan") return "pan";
                if (normalizedLabel.indexOf("reset") >= 0 || normalizedLabel.indexOf("home") >= 0) return "reset";
                if (normalizedLabel.indexOf("下载") >= 0) return "download";
                if (normalizedLabel.indexOf("放大") >= 0) return "zoomIn";
                if (normalizedLabel.indexOf("缩小") >= 0) return "zoomOut";
                if (normalizedLabel.indexOf("平移") >= 0) return "pan";
                if (normalizedLabel.indexOf("重置") >= 0) return "reset";

                var className = element.getAttribute("class") || "";
                if (className.indexOf("toImage") >= 0) return "download";
                if (className.indexOf("zoomIn") >= 0) return "zoomIn";
                if (className.indexOf("zoomOut") >= 0) return "zoomOut";
                if (className.indexOf("pan") >= 0) return "pan";
                if (className.indexOf("reset") >= 0 || className.indexOf("home") >= 0) return "reset";
                return "";
            }

            function scheduleControlLocalization() {
                localizeMapControls();
                setTimeout(localizeMapControls, 120);
                setTimeout(localizeMapControls, 500);
            }

            function scheduleMapReadyPoll() {
                if (mapReadyPollTimer) {
                    clearTimeout(mapReadyPollTimer);
                }
                mapReadyPollTimer = setTimeout(function () {
                    flushPendingSelection();
                    flushPendingLegendUpdate();
                }, 180);
            }

            function queueSelection(rowIndex, keepTooltip, retryCount) {
                pendingSelection = {
                    rowIndex: rowIndex,
                    keepTooltip: keepTooltip,
                    retryCount: retryCount || 0
                };
            }

            function flushPendingSelection() {
                if (!pendingSelection) return;
                if (!isMapMutationReady()) {
                    scheduleMapReadyPoll();
                    return;
                }
                var next = pendingSelection;
                pendingSelection = null;
                applyMapSelection(next.rowIndex, next.keepTooltip, next.retryCount);
            }

            function queueLegendUpdate() {
                pendingLegendUpdate = true;
            }

            function flushPendingLegendUpdate() {
                if (!pendingLegendUpdate) return;
                if (!isMapMutationReady()) {
                    scheduleMapReadyPoll();
                    return;
                }
                pendingLegendUpdate = false;
                applyLocalizedLegendNames();
            }

            function scheduleSelectionRetry(rowIndex, keepTooltip, retryCount) {
                var retries = typeof retryCount === "number" ? retryCount : 0;
                if (retries >= maxSelectionApplyRetries) return;
                if (selectionApplyTimer) {
                    clearTimeout(selectionApplyTimer);
                }
                queueSelection(rowIndex, keepTooltip, retries + 1);
                selectionApplyTimer = setTimeout(function () {
                    flushPendingSelection();
                }, 140);
            }

            function applyMapSelection(rowIndex, keepTooltip, retryCount) {
                selectedPlaceIndex = rowIndex;
                if (!isMapMutationReady()) {
                    queueSelection(rowIndex, keepTooltip, retryCount);
                    scheduleMapReadyPoll();
                    return;
                }

                data.forEach(function (trace, curveNumber) {
                    var opacity = trace.customdata.map(function (currentIndex) {
                        return currentIndex === rowIndex ? 1 : 0.6;
                    });
                    try {
                        var restyleResult = Plotly.restyle(mapId, {
                            "marker.opacity": [opacity]
                        }, [curveNumber]);
                        if (restyleResult && typeof restyleResult.catch === "function") {
                            restyleResult.catch(function () {
                                scheduleSelectionRetry(rowIndex, keepTooltip, retryCount);
                            });
                        }
                    } catch (error) {
                        scheduleSelectionRetry(rowIndex, keepTooltip, retryCount);
                    }
                });

                if (!keepTooltip) return;
                // Do not force Plotly.Fx.hover on map traces; it can emit
                // "Unrecognized subplot: xy" warnings for scattermap/map subplots.
            }

            api.selectPlace = function (rowIndex, keepTooltip) {
                if (rowIndex < 0 || rowIndex >= rows.length) return;
                applyMapSelection(rowIndex, keepTooltip !== false);
            };

            Plotly.newPlot(mapId, data, layout, config).then(function () {
                mapIsReady = true;
                compactMapAttribution();
                scheduleControlLocalization();
                applyMapSelection(0, true);
                flushPendingSelection();
                flushPendingLegendUpdate();
            });

            function applyThemeToMap(retryCount) {
                var themeConfig = getMapThemeConfig();
                var retries = typeof retryCount === "number" ? retryCount : 0;
                mapStyleTransitioning = true;
                try {
                    var relayoutResult = Plotly.relayout(mapId, {
                        "map.style": themeConfig.style,
                        "legend.font.color": themeConfig.legendFontColor,
                        "paper_bgcolor": themeConfig.backgroundColor,
                        "plot_bgcolor": themeConfig.backgroundColor
                    });
                    if (relayoutResult && typeof relayoutResult.then === "function") {
                        relayoutResult.then(function () {
                            mapStyleTransitioning = false;
                            flushPendingSelection();
                            flushPendingLegendUpdate();
                        });
                    } else {
                        mapStyleTransitioning = false;
                        flushPendingSelection();
                        flushPendingLegendUpdate();
                    }
                    if (relayoutResult && typeof relayoutResult.catch === "function") {
                        relayoutResult.catch(function () {
                            if (retries < maxThemeApplyRetries) {
                                themeApplyTimer = setTimeout(function () {
                                    applyThemeToMap(retries + 1);
                                }, 160);
                            } else {
                                mapStyleTransitioning = false;
                                flushPendingSelection();
                                flushPendingLegendUpdate();
                            }
                        });
                    }
                } catch (error) {
                    if (retries < maxThemeApplyRetries) {
                        themeApplyTimer = setTimeout(function () {
                            applyThemeToMap(retries + 1);
                        }, 160);
                    } else {
                        mapStyleTransitioning = false;
                        flushPendingSelection();
                        flushPendingLegendUpdate();
                    }
                }
            }

            function scheduleThemeApply() {
                if (themeApplyTimer) {
                    clearTimeout(themeApplyTimer);
                }
                themeApplyTimer = setTimeout(function () {
                    applyThemeToMap(0);
                }, 80);
            }

            function scheduleLegendApply() {
                if (legendApplyTimer) {
                    clearTimeout(legendApplyTimer);
                }
                legendApplyTimer = setTimeout(function () {
                    if (!isMapMutationReady()) {
                        queueLegendUpdate();
                        scheduleMapReadyPoll();
                        return;
                    }
                    applyLocalizedLegendNames();
                }, 80);
            }

            mapDiv.on("plotly_click", function (eventData) {
                hideHint();
                var rowIndex = eventData.points[0].customdata;
                applyMapSelection(rowIndex, true);
                if (typeof onPlaceClick === "function") {
                    onPlaceClick(rowIndex);
                }
            });

            mapDiv.on("plotly_afterplot", function () {
                mapIsReady = true;
                mapStyleTransitioning = false;
                compactMapAttribution();
                scheduleControlLocalization();
                flushPendingSelection();
                flushPendingLegendUpdate();
            });

            document.addEventListener(window.I18N_READY_EVENT || "i18n-ready", function () {
                scheduleLegendApply();
                scheduleControlLocalization();
                types.forEach(function (type, traceIdx) {
                    var rowsFiltered = rows.filter(function (row) { return row.type === type; });
                    try { Plotly.restyle(mapId, { text: [rowsFiltered.map(getRowLabel)] }, [traceIdx]); } catch (e) {}
                });
            });
            document.addEventListener("theme-change", function () {
                scheduleThemeApply();
            });
        });

        return api;
    };
})();
