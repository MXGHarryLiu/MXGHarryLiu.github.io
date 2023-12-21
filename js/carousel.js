function decorateCarousel(carouselId) {
    var carousel = document.getElementById(carouselId);
    var carouselInner = carousel.querySelector('.carousel-inner');
    var carouselItem = carouselInner.querySelectorAll('.carousel-item');
    var numSlides = carouselItem.length;
    // indicators
    // <ol class="carousel-indicators">
    //     <li data-target="#carouselId" data-slide-to="0" class="active"></li>
    //     <li data-target="#carouselId" data-slide-to="1"></li>
    //     ...
    // </ol>
    var indicatorsList = document.createElement('ol');
    indicatorsList.classList.add('carousel-indicators');
    for (var i = 0; i < numSlides; i++) {
        var indicatorItem = document.createElement('li');
        indicatorItem.setAttribute('data-target', '#' + carouselId);
        indicatorItem.setAttribute('data-slide-to', i);
        if (i === 0) {
            indicatorItem.classList.add('active');
        }
        indicatorsList.appendChild(indicatorItem);
    }
    carousel.appendChild(indicatorsList);
    // control
    var controlsHtml = `
        <div class="carousel-controls">
            <a class="carousel-control-prev" href="#${carouselId}" role="button" data-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="sr-only">Previous</span>
            </a>
            <a class="carousel-control-next" href="#${carouselId}" role="button" data-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="sr-only">Next</span>
            </a>
        </div>
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