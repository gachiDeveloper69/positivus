import { setSlider, setSliderTapZones, setSliderPagination } from '/js/modules/sliders.js';

document.addEventListener("DOMContentLoaded", async () => {
    setSlider('.studies__list', '.studies__item');
    setSliderTapZones('.studies__list', '.studies__item', '.tap-zone--left', '.tap-zone--right');

    setSlider('.reviews__slider-list', '.reviews__slider-item');
    setSliderPagination('.reviews__slider-list', '.reviews__slider-item', '.pagination__button');
    setSliderTapZones('.reviews__slider-list', '.reviews__slider-item', '.reviews__arrow-button--left', '.reviews__arrow-button--right');
});