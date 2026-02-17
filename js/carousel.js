function decorateCarousel(carouselId) {
    var carousel = document.getElementById(carouselId);
    // <div id="carouselId" class="carousel slide" data-bs-ride="carousel">
    carousel.classList.add('carousel', 'slide');
    carousel.setAttribute('data-bs-ride', 'carousel');
    var carouselInner = carousel.querySelector('.carousel-inner');
    var carouselItem = carouselInner.querySelectorAll('.carousel-item');
    var numSlides = carouselItem.length;
    // indicators
    // <div class="carousel-indicators">
    //     <button type="button" data-bs-target="#carouselId" data-bs-slide-to="0" class="active" aria-label="Slide 1"></button>
    //     <button type="button" data-bs-target="#carouselId" data-bs-slide-to="1" aria-label="Slide 2"></button>
    //     ...
    // </div>
    var indicatorsList = document.createElement('div');
    indicatorsList.classList.add('carousel-indicators');
    for (var i = 0; i < numSlides; i++) {
        var indicatorItem = document.createElement('button');
        indicatorItem.setAttribute('type', 'button');
        indicatorItem.setAttribute('data-bs-target', '#' + carouselId);
        indicatorItem.setAttribute('data-bs-slide-to', i);
        indicatorItem.setAttribute('aria-label', 'Slide ' + i);
        if (i === 0) {
            indicatorItem.classList.add('active');
        }
        indicatorsList.appendChild(indicatorItem);
    }
    carousel.appendChild(indicatorsList);
    // control
    var controlsHtml = `
        <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Previous</span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Next</span>
        </button>
    `;
    carousel.insertAdjacentHTML('beforeend', controlsHtml);
    // format carousel-item
    for (var i = 0; i < numSlides; i++) {
        var currentItem = carouselItem[i];
        if (i === 0) {
            currentItem.classList.add('active');
        }
        // warp h5
        var carouselCaptionDiv = document.createElement('div');
        carouselCaptionDiv.classList.add('carousel-caption', 'd-none', 'd-md-block');
        var h5Element = currentItem.querySelector('h5');
        if (h5Element) {
            carouselCaptionDiv.appendChild(h5Element);
            currentItem.appendChild(carouselCaptionDiv);
        }
    }
}

function setupCarouselAltMessage(carouselId, messageId, options) {
    var opts = options || {};
    if (opts.decorate !== false) {
        decorateCarousel(carouselId);
    }

    var carouselSelector = '#' + carouselId;
    var carouselEl = document.getElementById(carouselId);
    var messageEl = document.getElementById(messageId);
    if (!carouselEl || !messageEl) {
        return;
    }

    function getMessageFromItem(itemEl) {
        if (!itemEl) return '';
        if (typeof opts.getMessage === 'function') {
            return opts.getMessage(itemEl) || '';
        }
        var img = itemEl.querySelector('img');
        if (!img) return '';
        return img.getAttribute('alt') || '';
    }

    function updateByIndex(index, event) {
        var items = carouselEl.querySelectorAll('.carousel-item');
        if (!items || !items.length || index < 0 || index >= items.length) return;
        messageEl.textContent = getMessageFromItem(items[index]);
        if (typeof opts.onSlide === 'function') {
            opts.onSlide(index, event);
        }
    }

    carouselEl.addEventListener('slid.bs.carousel', function (event) {
        updateByIndex(event.to, event);
    });

    document.addEventListener(window.I18N_READY_EVENT || 'i18n-ready', function () {
        var activeItem = document.querySelector(carouselSelector + ' .carousel-item.active');
        var activeIndex = activeItem ? Array.prototype.indexOf.call(activeItem.parentNode.children, activeItem) : 0;
        updateByIndex(Math.max(0, activeIndex), null);
    });

    updateByIndex(0, null);
}
