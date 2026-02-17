(function () {
    var DEFAULT_WORKSPACE_DATA_URL = "data/workspace-cloud.csv";

    var CATEGORY_COLORS = {
        "Productivity and Design": "#ff7f0e",
        "Programming": "#1f77b4",
        "Research": "#2ca02c"
    };

    var FAMILIARITY_SIZE_MIN = 18;
    var FAMILIARITY_SIZE_MAX = 54;

    function cloudHeightForWidth(width) {
        if (width < 420) {
            return Math.max(340, Math.round(width * 0.95));
        }
        return Math.max(340, Math.min(500, Math.round(width * 0.82)));
    }

    function makeLegend(legendEl) {
        if (!legendEl) return;

        var categoryLegend = Object.keys(CATEGORY_COLORS).map(function (category) {
            return "<span class=\"legend-item\"><i class=\"legend-dot\" style=\"background-color:" +
                CATEGORY_COLORS[category] +
                ";\"></i>" +
                category +
                "</span>";
        }).join("");

        legendEl.innerHTML =
            categoryLegend;
    }

    function isNumericValue(value) {
        var num = parseFloat(value);
        return !isNaN(num) && isFinite(num);
    }

    function buildFamiliaritySizeMap(words) {
        var seen = {};
        var levels = [];

        (words || []).forEach(function (word) {
            var key = (word.familiarity || "").toString().trim();
            if (!key || seen[key]) return;
            seen[key] = true;
            levels.push(key);
        });

        if (!levels.length) {
            return {};
        }

        var allNumeric = levels.every(isNumericValue);
        if (allNumeric) {
            levels.sort(function (a, b) {
                return parseFloat(b) - parseFloat(a);
            });
        } else {
            levels.sort(function (a, b) {
                return a.localeCompare(b, undefined, { sensitivity: "base" });
            });
        }

        var map = {};
        var count = levels.length;
        for (var i = 0; i < count; i++) {
            var ratio = count === 1 ? 0 : i / (count - 1);
            var size = Math.round(FAMILIARITY_SIZE_MAX - ratio * (FAMILIARITY_SIZE_MAX - FAMILIARITY_SIZE_MIN));
            map[levels[i]] = size;
        }
        return map;
    }

    function normalizeWorkspaceRows(rows) {
        return (rows || [])
            .map(function (row) {
                return {
                    text: row.text,
                    category: row.category,
                    familiarity: (row.familiarity || "").toLowerCase(),
                    slide: parseInt(row.slide, 10),
                    commentId: row.commentId
                };
            })
            .filter(function (row) {
                return row.text &&
                    row.category &&
                    row.familiarity &&
                    !isNaN(row.slide) &&
                    row.commentId;
            });
    }

    function loadWorkspaceWords(url, onLoaded) {
        d3.csv(url, function (error, rows) {
            if (error) {
                onLoaded([]);
                return;
            }
            onLoaded(normalizeWorkspaceRows(rows));
        });
    }

    function applySelectedClass(textNodes, selectedCommentId) {
        textNodes.classed("is-selected", function (d) {
            return d.meta && d.meta.commentId === selectedCommentId;
        });
    }

    function bindInteractiveMotion(containerEl, svg, textNodes) {
        var pointer = { nx: 0, ny: 0 };

        function applyTransforms() {
            textNodes.attr("transform", function (d) {
                var parallaxX = (d.x / 24) * pointer.nx;
                var parallaxY = (d.y / 24) * pointer.ny;
                var x = d.x + parallaxX;
                var y = d.y + parallaxY;
                return "translate(" + x + "," + y + ")rotate(" + d.rotate + ")";
            });
        }

        function onPointerMove(event) {
            var e = event || window.event;
            var rect = containerEl.getBoundingClientRect();
            if (!rect.width || !rect.height) return;

            var px = (e.clientX - rect.left) / rect.width;
            var py = (e.clientY - rect.top) / rect.height;
            pointer.nx = Math.max(-1, Math.min(1, (px - 0.5) * 2));
            pointer.ny = Math.max(-1, Math.min(1, (py - 0.5) * 2));

            var tiltX = (-pointer.ny * 5).toFixed(2);
            var tiltY = (pointer.nx * 7).toFixed(2);
            svg.style("transform", "perspective(920px) rotateX(" + tiltX + "deg) rotateY(" + tiltY + "deg)");

            applyTransforms();
        }

        function onPointerLeave() {
            pointer.nx = 0;
            pointer.ny = 0;
            svg.style("transform", "perspective(920px) rotateX(0deg) rotateY(0deg)");
            applyTransforms();
        }

        if (containerEl._workspaceCloudPointerHandlers) {
            containerEl.removeEventListener("mousemove", containerEl._workspaceCloudPointerHandlers.move);
            containerEl.removeEventListener("mouseleave", containerEl._workspaceCloudPointerHandlers.leave);
        }

        containerEl._workspaceCloudPointerHandlers = {
            move: onPointerMove,
            leave: onPointerLeave
        };

        containerEl.addEventListener("mousemove", onPointerMove);
        containerEl.addEventListener("mouseleave", onPointerLeave);
    }

    function drawCloudText(containerEl, svg, width, height, layoutWords, onWordClick, onFirstInteraction, selectionState) {
        var group = svg.append("g")
            .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

        var textNodes = group.selectAll("text")
            .data(layoutWords)
            .enter()
            .append("text")
            .attr("class", "workspace-cloud-word")
            .attr("data-comment-id", function (d) { return d.meta.commentId; })
            .style("font-size", function (d) { return d.size + "px"; })
            .style("font-family", "Segoe UI, Arial, sans-serif")
            .style("fill", function (d) { return d.color; })
            .style("cursor", "pointer")
            .style("opacity", 0.92)
            .attr("text-anchor", "middle")
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")rotate(" + d.rotate + ")";
            })
            .text(function (d) { return d.text; })
            .on("click", function (d) {
                if (typeof onFirstInteraction === "function") {
                    onFirstInteraction();
                }
                selectionState.activeCommentId = d.meta.commentId;
                applySelectedClass(textNodes, selectionState.activeCommentId);
                if (typeof onWordClick === "function") {
                    onWordClick(d.meta);
                }
            });

        textNodes.append("title")
            .text(function (d) {
                return d.meta.category + " | Familiarity: " + d.meta.familiarity;
            });

        applySelectedClass(textNodes, selectionState.activeCommentId);
        bindInteractiveMotion(containerEl, svg, textNodes);

        return {
            textNodes: textNodes
        };
    }

    function runCloudLayout(width, height, baseWords, familiaritySizeMap, onWordClick, onDone) {
        var attempt = 0;
        var maxAttempts = 7;
        var scaleFactor = 1;
        var padding = 4;
        var bestLayout = [];

        function attemptLayout() {
            var cloudWords = baseWords.map(function (word) {
                var baseSize = familiaritySizeMap[word.familiarity] || FAMILIARITY_SIZE_MIN;
                return {
                    text: word.text,
                    size: Math.max(12, Math.round(baseSize * scaleFactor)),
                    color: CATEGORY_COLORS[word.category] || "#334155",
                    meta: word
                };
            });

            d3.layout.cloud()
                .size([width, height])
                .words(cloudWords)
                .padding(padding)
                .rotate(function () { return 0; })
                .font("Segoe UI")
                .fontSize(function (d) { return d.size; })
                .on("end", function (layoutWords) {
                    if (layoutWords.length > bestLayout.length) {
                        bestLayout = layoutWords;
                    }

                    if (layoutWords.length === baseWords.length || attempt >= maxAttempts) {
                        onDone(bestLayout);
                        return;
                    }

                    attempt += 1;
                    scaleFactor *= 0.88;
                    padding = Math.max(1, padding - 1);
                    attemptLayout();
                })
                .start();
        }

        attemptLayout();
    }

    function renderCloud(containerEl, words, onWordClick, onFirstInteraction, selectionState, onRendered) {
        var width = containerEl.clientWidth || 520;
        var height = cloudHeightForWidth(width);
        containerEl.style.height = height + "px";
        containerEl.innerHTML = "";

        var svg = d3.select(containerEl)
            .append("svg")
            .attr("viewBox", "0 0 " + width + " " + height)
            .attr("preserveAspectRatio", "xMidYMid meet");

        if (!words || !words.length) {
            if (typeof onRendered === "function") {
                onRendered({ textNodes: null });
            }
            return;
        }

        var familiaritySizeMap = buildFamiliaritySizeMap(words);

        runCloudLayout(width, height, words, familiaritySizeMap, onWordClick, function (layoutWords) {
            var rendered = drawCloudText(containerEl, svg, width, height, layoutWords, onWordClick, onFirstInteraction, selectionState);
            if (typeof onRendered === "function") {
                onRendered(rendered);
            }
        });
    }

    function debounce(fn, waitMs) {
        var timerId = null;
        return function () {
            if (timerId) {
                clearTimeout(timerId);
            }
            timerId = setTimeout(fn, waitMs);
        };
    }

    window.initWorkspaceWordCloud = function (options) {
        if (!window.d3 || !d3.layout || !d3.layout.cloud) {
            return;
        }

        var opts = options || {};
        var containerId = opts.containerId || "workspace-cloud";
        var containerEl = document.getElementById(containerId);
        if (!containerEl) return;

        var legendId = opts.legendId || "workspace-cloud-legend";
        var legendEl = document.getElementById(legendId);
        makeLegend(legendEl);

        var hintId = opts.hintId || "workspace-cloud-hint";
        var hintEl = document.getElementById(hintId);
        var hasInteracted = false;
        var selectionState = { activeCommentId: null };
        var renderedCloud = null;
        var wordsState = { list: [] };
        var dataUrl = opts.dataUrl || DEFAULT_WORKSPACE_DATA_URL;

        function onFirstInteraction() {
            if (hasInteracted) return;
            hasInteracted = true;
            if (hintEl) {
                hintEl.classList.add("is-hidden");
            }
        }

        function getWordByCommentId(commentId) {
            for (var i = 0; i < wordsState.list.length; i++) {
                if (wordsState.list[i].commentId === commentId) {
                    return wordsState.list[i];
                }
            }
            return null;
        }

        function getWordBySlide(slide) {
            for (var i = 0; i < wordsState.list.length; i++) {
                if (wordsState.list[i].slide === slide) {
                    return wordsState.list[i];
                }
            }
            return null;
        }

        function setActiveCommentId(commentId) {
            selectionState.activeCommentId = commentId;
            if (renderedCloud && renderedCloud.textNodes) {
                applySelectedClass(renderedCloud.textNodes, selectionState.activeCommentId);
            }
        }

        var onWordClick = opts.onWordClick;
        loadWorkspaceWords(dataUrl, function (loadedWords) {
            wordsState.list = loadedWords;
            renderCloud(containerEl, wordsState.list, onWordClick, onFirstInteraction, selectionState, function (rendered) {
                renderedCloud = rendered;
            });
        });

        if (containerEl._workspaceCloudResizeHandler) {
            window.removeEventListener("resize", containerEl._workspaceCloudResizeHandler);
        }

        var resizeHandler = debounce(function () {
            if (hasInteracted && hintEl) {
                hintEl.classList.add("is-hidden");
            }
            renderCloud(containerEl, wordsState.list, onWordClick, onFirstInteraction, selectionState, function (rendered) {
                renderedCloud = rendered;
            });
        }, 150);

        containerEl._workspaceCloudResizeHandler = resizeHandler;
        window.addEventListener("resize", resizeHandler);

        return {
            setActiveByCommentId: function (commentId) {
                var word = getWordByCommentId(commentId);
                if (!word) return null;
                setActiveCommentId(word.commentId);
                return word;
            },
            setActiveBySlide: function (slide) {
                var word = getWordBySlide(slide);
                if (!word) return null;
                setActiveCommentId(word.commentId);
                return word;
            },
            getActiveCommentId: function () {
                return selectionState.activeCommentId;
            }
        };
    };
})();
