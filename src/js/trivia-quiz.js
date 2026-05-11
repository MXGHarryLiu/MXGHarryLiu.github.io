(function () {
    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }

    function getI18n(key, fallback) {
        if (window.i18nManager && typeof window.i18nManager.getContent === 'function') {
            return window.i18nManager.getContent(key, fallback);
        }
        return fallback;
    }

    function classifyResult(card, picked) {
        var correctSet = (card.getAttribute('data-quiz-correct') || '').split(',');
        var pickedCorrect = picked.filter(function (opt) {
            return correctSet.indexOf(opt) !== -1;
        });
        if (pickedCorrect.length === correctSet.length && picked.length === correctSet.length) {
            return 'correct';
        }
        if (pickedCorrect.length === 0) {
            return 'allWrong';
        }
        return 'incorrect';
    }

    var FEEDBACK_DEFAULTS = {
        correct: 'Correct!',
        incorrect: 'Not quite.',
        allWrong: 'Whoops — none of those count!'
    };

    var FEEDBACK_ICONS = {
        correct: 'bi-check-circle-fill',
        incorrect: 'bi-exclamation-circle-fill',
        allWrong: 'bi-x-circle-fill'
    };

    function applyFeedbackText(feedback) {
        var result = feedback.dataset.feedbackResult;
        if (!result) return;
        var span = feedback.querySelector('.quiz-feedback-text');
        if (!span) return;
        span.textContent = getI18n('trivia/' + result, FEEDBACK_DEFAULTS[result] || '');
    }

    function reveal(card, result) {
        var correctSet = (card.getAttribute('data-quiz-correct') || '').split(',');
        card.querySelectorAll('.quiz-option').forEach(function (btn) {
            var opt = btn.getAttribute('data-option');
            var shouldBeChecked = correctSet.indexOf(opt) !== -1;
            var isChecked = btn.classList.contains('is-selected');
            btn.classList.remove('is-selected');
            if (shouldBeChecked) {
                btn.classList.add('is-correct');
            } else if (isChecked) {
                btn.classList.add('is-incorrect');
            }
            btn.disabled = true;
        });
        var submit = card.querySelector('.quiz-submit');
        if (submit) submit.disabled = true;
        var feedback = card.querySelector('.quiz-feedback');
        if (feedback) {
            var iconClass = FEEDBACK_ICONS[result] || FEEDBACK_ICONS.incorrect;
            feedback.innerHTML = '<i class="bi ' + iconClass + ' quiz-feedback-icon" aria-hidden="true"></i><span class="quiz-feedback-text"></span>';
            feedback.dataset.feedbackResult = result;
            applyFeedbackText(feedback);
            feedback.classList.toggle('is-correct', result === 'correct');
            feedback.classList.toggle('is-incorrect', result !== 'correct');
            feedback.hidden = false;
        }
        var description = card.querySelector('.quiz-description');
        if (description) description.hidden = false;
        card.dataset.quizState = 'revealed';
        card.dataset.quizResult = result;
        var quiz = card.closest('.trivia-quiz');
        if (quiz && typeof quiz._refreshStepper === 'function') {
            quiz._refreshStepper();
        }
    }

    function pickedFromCard(card) {
        return Array.prototype.map.call(
            card.querySelectorAll('.quiz-option.is-selected'),
            function (btn) { return btn.getAttribute('data-option'); }
        );
    }

    function init() {
        var quiz = document.getElementById('trivia-quiz');
        if (!quiz || quiz.dataset.quizInitialized === 'true') return;
        quiz.dataset.quizInitialized = 'true';

        var body = quiz.querySelector('.trivia-card-body');
        if (!body) return;

        var cards = Array.prototype.slice.call(body.querySelectorAll('.quiz-card'));
        if (!cards.length) return;

        shuffle(cards);
        cards.forEach(function (card) { body.appendChild(card); });

        cards.forEach(function (card) {
            var optionsContainer = card.querySelector('.quiz-options');
            if (optionsContainer) {
                var opts = Array.prototype.slice.call(optionsContainer.querySelectorAll('.quiz-option'));
                shuffle(opts);
                opts.forEach(function (opt) { optionsContainer.appendChild(opt); });
            }

            var type = card.getAttribute('data-quiz-type');
            card.querySelectorAll('.quiz-option').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    if (card.dataset.quizState === 'revealed') return;
                    var opt = btn.getAttribute('data-option');
                    if (type === 'single') {
                        reveal(card, classifyResult(card, [opt]));
                    } else {
                        btn.classList.toggle('is-selected');
                    }
                });
            });
            var submit = card.querySelector('.quiz-submit');
            if (submit) {
                submit.addEventListener('click', function () {
                    if (card.dataset.quizState === 'revealed') return;
                    var picked = pickedFromCard(card);
                    if (!picked.length) return;
                    reveal(card, classifyResult(card, picked));
                });
            }
        });

        var stepper = quiz.querySelector('.quiz-stepper');
        var counter = quiz.querySelector('.trivia-counter');
        var prevBtn = quiz.querySelector('.trivia-prev');
        var nextBtn = quiz.querySelector('.trivia-next');
        var scoreEl = quiz.querySelector('.quiz-score');
        var currentIndex = 0;

        function refreshStepper() {
            if (stepper) {
                stepper.querySelectorAll('.quiz-step').forEach(function (step, i) {
                    step.classList.toggle('is-active', i === currentIndex);
                    var card = cards[i];
                    step.classList.remove('is-correct', 'is-incorrect');
                    if (card && card.dataset.quizState === 'revealed') {
                        step.classList.add(card.dataset.quizResult === 'correct' ? 'is-correct' : 'is-incorrect');
                    }
                });
            }
            if (scoreEl) {
                var answered = 0;
                var correct = 0;
                cards.forEach(function (card) {
                    if (card.dataset.quizState === 'revealed') {
                        answered += 1;
                        if (card.dataset.quizResult === 'correct') correct += 1;
                    }
                });
                if (answered === 0) {
                    scoreEl.hidden = true;
                    scoreEl.textContent = '';
                } else {
                    scoreEl.hidden = false;
                    var score = Math.round((correct / cards.length) * 100);
                    scoreEl.textContent = score + ' / 100';
                }
            }
        }

        function applyTitle() {
            var titleEl = quiz.querySelector('.trivia-question-title');
            if (!titleEl) return;
            var card = cards[currentIndex];
            if (!card) return;
            var key = card.getAttribute('data-quiz-question-key');
            if (!key) return;
            titleEl.textContent = getI18n(key, '');
        }

        function showCurrent() {
            cards.forEach(function (card, i) {
                card.classList.toggle('is-active', i === currentIndex);
            });
            if (counter) {
                counter.textContent = (currentIndex + 1) + ' / ' + cards.length;
            }
            if (prevBtn) {
                prevBtn.classList.toggle('is-disabled', currentIndex === 0);
                prevBtn.setAttribute('aria-disabled', currentIndex === 0 ? 'true' : 'false');
            }
            if (nextBtn) {
                nextBtn.classList.toggle('is-disabled', currentIndex === cards.length - 1);
                nextBtn.setAttribute('aria-disabled', currentIndex === cards.length - 1 ? 'true' : 'false');
            }
            applyTitle();
            refreshStepper();
        }

        function go(index) {
            if (index < 0 || index >= cards.length) return;
            currentIndex = index;
            showCurrent();
        }

        quiz._refreshStepper = refreshStepper;

        if (prevBtn) {
            prevBtn.addEventListener('click', function (e) {
                e.preventDefault();
                if (prevBtn.classList.contains('is-disabled')) return;
                go(currentIndex - 1);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', function (e) {
                e.preventDefault();
                if (nextBtn.classList.contains('is-disabled')) return;
                go(currentIndex + 1);
            });
        }

        function applyNavLabels() {
            var prevLabel = getI18n('button/previous', 'Previous');
            var nextLabel = getI18n('button/next', 'Next');
            if (prevBtn) {
                prevBtn.setAttribute('aria-label', prevLabel);
                prevBtn.setAttribute('title', prevLabel);
            }
            if (nextBtn) {
                nextBtn.setAttribute('aria-label', nextLabel);
                nextBtn.setAttribute('title', nextLabel);
            }
        }
        applyNavLabels();
        document.addEventListener(window.I18N_READY_EVENT || 'i18n-ready', function () {
            applyNavLabels();
            applyTitle();
            quiz.querySelectorAll('.quiz-feedback').forEach(applyFeedbackText);
        });

        var retryBtn = null;
        if (stepper) {
            stepper.innerHTML = '';
            cards.forEach(function (_, i) {
                var step = document.createElement('button');
                step.type = 'button';
                step.className = 'quiz-step';
                step.setAttribute('data-step', i);
                step.setAttribute('aria-label', String(i + 1));
                step.textContent = String(i + 1);
                step.addEventListener('click', function () { go(i); });
                stepper.appendChild(step);
            });
            retryBtn = document.createElement('button');
            retryBtn.type = 'button';
            retryBtn.className = 'quiz-step quiz-retry';
            retryBtn.hidden = true;
            retryBtn.innerHTML = '<i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>';
            retryBtn.addEventListener('click', resetQuiz);
            stepper.appendChild(retryBtn);
        }

        function applyRetryLabel() {
            if (!retryBtn) return;
            var label = getI18n('trivia/retry', 'Try again');
            retryBtn.setAttribute('aria-label', label);
            retryBtn.setAttribute('title', label);
        }
        applyRetryLabel();

        function updateRetryVisibility() {
            if (!retryBtn) return;
            var allRevealed = cards.every(function (card) {
                return card.dataset.quizState === 'revealed';
            });
            retryBtn.hidden = !allRevealed;
        }

        function resetCard(card) {
            card.querySelectorAll('.quiz-option').forEach(function (btn) {
                btn.classList.remove('is-correct', 'is-incorrect', 'is-selected');
                btn.disabled = false;
            });
            var submit = card.querySelector('.quiz-submit');
            if (submit) submit.disabled = false;
            var feedback = card.querySelector('.quiz-feedback');
            if (feedback) {
                feedback.hidden = true;
                feedback.innerHTML = '';
                feedback.classList.remove('is-correct', 'is-incorrect');
                delete feedback.dataset.feedbackResult;
            }
            var description = card.querySelector('.quiz-description');
            if (description) description.hidden = true;
            delete card.dataset.quizState;
            delete card.dataset.quizResult;
        }

        function resetQuiz() {
            cards.forEach(resetCard);
            shuffle(cards);
            cards.forEach(function (card) { body.appendChild(card); });
            cards.forEach(function (card) {
                var optionsContainer = card.querySelector('.quiz-options');
                if (!optionsContainer) return;
                var opts = Array.prototype.slice.call(optionsContainer.querySelectorAll('.quiz-option'));
                shuffle(opts);
                opts.forEach(function (opt) { optionsContainer.appendChild(opt); });
            });
            currentIndex = 0;
            showCurrent();
        }

        var originalRefreshStepper = refreshStepper;
        refreshStepper = function () {
            originalRefreshStepper();
            updateRetryVisibility();
        };
        quiz._refreshStepper = refreshStepper;

        showCurrent();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
