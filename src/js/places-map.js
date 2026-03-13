(function () {
    function getColorByType(type) {
        switch (type) {
            case "home":
                return "#ff1e00";
            case "sojourn":
                return "#fff500";
            default:
                return "#4bd8b5";
        }
    }

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

        var api = {
            selectPlace: function () {}
        };
        window.placeMapSync = api;

        d3.csv(csvUrl, function (err, rows) {
            if (err || !rows || !rows.length) return;

            var typeArray = rows.map(function (row) { return row.type; });
            var types = [];
            typeArray.forEach(function (type) {
                if (types.indexOf(type) < 0) {
                    types.push(type);
                }
            });

            var rowIndexByLabel = {};
            rows.forEach(function (row, idx) {
                rowIndexByLabel[row.label] = idx;
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
                    text: unpack(rowsFiltered, "label"),
                    customdata: unpack(rowsFiltered, "label").map(function (label) {
                        return rowIndexByLabel[label];
                    }),
                    hovertemplate: "%{text}<extra></extra>",
                    marker: {
                        size: unpack(rowsFiltered, "label").map(function () { return 14; }),
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
                    y: 1,
                    orientation: "h",
                    font: { color: getMapThemeConfig().legendFontColor }
                },
                paper_bgcolor: getMapThemeConfig().backgroundColor,
                plot_bgcolor: getMapThemeConfig().backgroundColor
            };

            var config = {
                responsive: true,
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
                flushPendingSelection();
                flushPendingLegendUpdate();
            });

            document.addEventListener(window.I18N_READY_EVENT || "i18n-ready", function () {
                scheduleLegendApply();
            });
            document.addEventListener("theme-change", function () {
                scheduleThemeApply();
            });
        });

        return api;
    };
})();
