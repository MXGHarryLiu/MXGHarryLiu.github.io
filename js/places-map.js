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
                    Plotly.restyle(mapId, { name: getLocalizedLegendName(type) }, [idx]);
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
                    style: "open-street-map",
                    center: { lat: 38.03, lon: -90.70 },
                    zoom: 0
                },
                margin: { l: 0, r: 0, t: 0, b: 0, pad: 5 },
                showlegend: true,
                legend: {
                    x: 0,
                    xanchor: "left",
                    y: 1,
                    orientation: "h"
                }
            };

            var config = {
                responsive: true,
                modeBarButtonsToRemove: ["lasso2d", "select2d"]
            };

            var selectedPlaceIndex = 0;

            function applyMapSelection(rowIndex, keepTooltip) {
                selectedPlaceIndex = rowIndex;
                data.forEach(function (trace, curveNumber) {
                    var opacity = trace.customdata.map(function (currentIndex) {
                        return currentIndex === rowIndex ? 1 : 0.6;
                    });
                    Plotly.restyle(mapId, {
                        "marker.opacity": [opacity]
                    }, [curveNumber]);
                });

                if (!keepTooltip) return;
                var ref = pointRefByRowIndex[rowIndex];
                if (!ref) return;
                Plotly.Fx.hover(mapId, [{
                    curveNumber: ref.curveNumber,
                    pointNumber: ref.pointNumber
                }]);
            }

            api.selectPlace = function (rowIndex, keepTooltip) {
                if (rowIndex < 0 || rowIndex >= rows.length) return;
                applyMapSelection(rowIndex, keepTooltip !== false);
            };

            Plotly.newPlot(mapId, data, layout, config).then(function () {
                applyMapSelection(0, true);
            });

            mapDiv.on("plotly_click", function (eventData) {
                hideHint();
                var rowIndex = eventData.points[0].customdata;
                applyMapSelection(rowIndex, true);
                if (typeof onPlaceClick === "function") {
                    onPlaceClick(rowIndex);
                }
            });

            mapDiv.on("plotly_relayout", function () {
                applyMapSelection(selectedPlaceIndex, true);
            });

            document.addEventListener(window.I18N_READY_EVENT || "i18n-ready", function () {
                applyLocalizedLegendNames();
            });
        });

        return api;
    };
})();
