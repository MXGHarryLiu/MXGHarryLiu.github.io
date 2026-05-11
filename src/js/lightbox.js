(function () {
    var MIN_ZOOM = 1;
    var MAX_ZOOM = 4;
    var ZOOM_STEP = 0.1;

    function ensureLightboxModal() {
        var existingModal = document.getElementById('lightboxModal');
        if (existingModal) return existingModal;

        var modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'lightboxModal';
        modal.tabIndex = -1;
        modal.setAttribute('aria-labelledby', 'ModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = [
            '<div class="modal-dialog modal-lg">',
            '    <div class="modal-content">',
            '        <div class="modal-header">',
            '            <h5 class="modal-title" id="ModalLabel"></h5>',
            '            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>',
            '        </div>',
            '        <div class="modal-body">',
            '            <img src="" class="img-fluid">',
            '        </div>',
            '    </div>',
            '</div>'
        ].join('');
        document.body.appendChild(modal);
        return modal;
    }

    function ensureZoomControl(lightboxModal) {
        var controls = lightboxModal.querySelector('.lightbox-zoom-control');
        if (controls) return controls;

        controls = document.createElement('div');
        controls.className = 'lightbox-zoom-control';
        controls.innerHTML = [
            '<label for="lightboxZoomRange" title="Zoom"><i class="bi bi-zoom-in" aria-hidden="true"></i><span class="visually-hidden">Zoom</span></label>',
            '<input id="lightboxZoomRange" type="range" min="100" max="400" step="5" value="100" aria-label="Zoom image">'
        ].join('');
        lightboxModal.querySelector('.modal-content').appendChild(controls);
        return controls;
    }

    function getBootstrapModal(lightboxModal) {
        if (!window.bootstrap || !window.bootstrap.Modal) return null;
        if (typeof window.bootstrap.Modal.getOrCreateInstance === 'function') {
            return window.bootstrap.Modal.getOrCreateInstance(lightboxModal);
        }
        return new window.bootstrap.Modal(lightboxModal);
    }

    function getLargeImageSrc(src) {
        return src ? src.replace(/-s\./, '.') : '';
    }

    function getImageTitle(image, src) {
        if (image) {
            return image.getAttribute('title') || image.getAttribute('alt') || '';
        }
        if (window.i18nManager && typeof window.i18nManager.getContent === 'function') {
            return window.i18nManager.getContent('alt/' + src, '');
        }
        return '';
    }

    function initLightbox() {
        var lightboxModal = ensureLightboxModal();
        var modalBody = lightboxModal.querySelector('.modal-body');
        var modalImage = lightboxModal.querySelector('.modal-body img');
        var modalTitle = lightboxModal.querySelector('.modal-title');
        if (!modalBody || !modalImage || !modalTitle) return;

        var zoomRange = ensureZoomControl(lightboxModal).querySelector('input');
        var zoom = 1;
        var panX = 0;
        var panY = 0;
        var pointers = new Map();
        var pinchState = null;
        var panState = null;

        modalBody.classList.add('lightbox-stage');
        modalImage.classList.add('lightbox-image');
        modalImage.draggable = false;

        function clampZoom(value) {
            return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
        }

        function getPanBounds() {
            var stageRect = modalBody.getBoundingClientRect();
            var scaledWidth = modalImage.offsetWidth * zoom;
            var scaledHeight = modalImage.offsetHeight * zoom;
            return {
                minX: scaledWidth > stageRect.width ? (stageRect.width - scaledWidth) / 2 : 0,
                maxX: scaledWidth > stageRect.width ? (scaledWidth - stageRect.width) / 2 : 0,
                minY: scaledHeight > stageRect.height ? (stageRect.height - scaledHeight) / 2 : 0,
                maxY: scaledHeight > stageRect.height ? (scaledHeight - stageRect.height) / 2 : 0
            };
        }

        function constrainPan() {
            var bounds = getPanBounds();
            panX = Math.min(bounds.maxX, Math.max(bounds.minX, panX));
            panY = Math.min(bounds.maxY, Math.max(bounds.minY, panY));
        }

        function applyZoom(nextZoom) {
            zoom = clampZoom(nextZoom);
            if (zoom === 1) {
                panX = 0;
                panY = 0;
            }
            constrainPan();
            applyTransform();
            if (zoomRange) {
                zoomRange.value = Math.round(zoom * 100);
            }
        }

        function applyTransform() {
            modalImage.style.transform = 'scale(' + zoom + ') translate(' + (panX / zoom) + 'px, ' + (panY / zoom) + 'px)';
            modalImage.style.cursor = zoom > 1 ? 'grab' : 'zoom-in';
        }

        function resetZoom() {
            pointers.clear();
            pinchState = null;
            panState = null;
            panX = 0;
            panY = 0;
            applyZoom(1);
        }

        function setLightboxImage(src, title) {
            var largeSrc = getLargeImageSrc(src);
            if (!largeSrc) return false;
            var imageTitle = title || '';
            modalImage.src = largeSrc;
            modalImage.alt = imageTitle;
            modalTitle.textContent = imageTitle;
            return true;
        }

        function openImage(image) {
            var src = image.getAttribute('src');
            var title = getImageTitle(image, src);
            var bootstrapModal = getBootstrapModal(lightboxModal);
            if (!setLightboxImage(src, title) || !bootstrapModal) return;
            bootstrapModal.show();
        }

        function getPointerDistance() {
            var activePointers = Array.from(pointers.values());
            if (activePointers.length < 2) return 0;
            var dx = activePointers[0].clientX - activePointers[1].clientX;
            var dy = activePointers[0].clientY - activePointers[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }

        function releasePointer(event) {
            pointers.delete(event.pointerId);
            if (panState && panState.pointerId === event.pointerId) {
                panState = null;
                modalImage.style.transition = '';
                applyTransform();
            }
            if (pointers.size < 2) {
                pinchState = null;
            }
        }

        function beginPan(event) {
            if (zoom <= 1 || pointers.size > 1) return;
            panState = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                panX: panX,
                panY: panY
            };
            modalImage.style.transition = 'none';
            modalImage.style.cursor = 'grabbing';
        }

        function updatePan(event) {
            if (!panState || panState.pointerId !== event.pointerId || zoom <= 1) return;
            panX = panState.panX + event.clientX - panState.startX;
            panY = panState.panY + event.clientY - panState.startY;
            constrainPan();
            applyTransform();
            modalImage.style.cursor = 'grabbing';
        }

        lightboxModal.addEventListener('show.bs.modal', function (event) {
            var trigger = event.relatedTarget;
            var src = trigger ? trigger.getAttribute('data-bs-img') : '';
            if (src) {
                setLightboxImage(src, getImageTitle(null, src));
            }
            document.body.classList.add('lightbox-open');
            resetZoom();
        });

        lightboxModal.addEventListener('hidden.bs.modal', function () {
            document.body.classList.remove('lightbox-open');
            modalImage.removeAttribute('style');
            pointers.clear();
            pinchState = null;
            panState = null;
            panX = 0;
            panY = 0;
        });

        modalImage.addEventListener('load', resetZoom);
        modalImage.addEventListener('dragstart', function (event) {
            event.preventDefault();
        });

        modalBody.addEventListener('wheel', function (event) {
            event.preventDefault();
            var direction = event.deltaY < 0 ? 1 : -1;
            applyZoom(zoom + direction * ZOOM_STEP);
        }, { passive: false });

        modalBody.addEventListener('pointerdown', function (event) {
            pointers.set(event.pointerId, event);
            if (typeof modalBody.setPointerCapture === 'function') {
                modalBody.setPointerCapture(event.pointerId);
            }
            if (pointers.size === 2) {
                panState = null;
                pinchState = {
                    distance: getPointerDistance(),
                    zoom: zoom
                };
                return;
            }
            beginPan(event);
        });

        modalBody.addEventListener('pointermove', function (event) {
            if (!pointers.has(event.pointerId)) return;
            pointers.set(event.pointerId, event);
            if (pinchState && pointers.size >= 2) {
                var distance = getPointerDistance();
                if (!distance || !pinchState.distance) return;
                applyZoom(pinchState.zoom * (distance / pinchState.distance));
                return;
            }
            updatePan(event);
        });

        modalBody.addEventListener('pointerup', function (event) {
            if (typeof modalBody.releasePointerCapture === 'function') {
                modalBody.releasePointerCapture(event.pointerId);
            }
            releasePointer(event);
        });
        modalBody.addEventListener('pointercancel', function (event) {
            if (typeof modalBody.releasePointerCapture === 'function') {
                modalBody.releasePointerCapture(event.pointerId);
            }
            releasePointer(event);
        });
        modalBody.addEventListener('pointerleave', releasePointer);

        if (zoomRange) {
            zoomRange.addEventListener('input', function () {
                applyZoom(Number(zoomRange.value) / 100);
            });
        }

        document.querySelectorAll('[data-lightbox-gallery] img').forEach(function (image) {
            image.classList.add('lightbox-trigger');
            image.setAttribute('role', 'button');
            image.setAttribute('tabindex', '0');
            image.addEventListener('click', function () {
                openImage(image);
            });
            image.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openImage(image);
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', initLightbox);
})();
