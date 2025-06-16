const sliderState = {
  _currentSlideIndex: 0,

  get currentSlideIndex() {
    return this._currentSlideIndex;
  },

  set currentSlideIndex(value) {
    this._currentSlideIndex = value;
    if (typeof this.onChange === 'function') {
      this.onChange(value);
    }
  },

  onChange: null // сюда назначаем функцию, которая будет вызываться
};

//let currentSlideIndex = 0;

export function centerClosestSlide(slider, slides, slideIndex = null) {
    const sliderRect = slider.getBoundingClientRect();
    const sliderCenter = sliderRect.left + sliderRect.width / 2;

    let targetSlide;

    if (slideIndex !== null && slides[slideIndex]) {
      targetSlide = slides[slideIndex];
    } else {
      // если индекс не указан — ищем ближайший слайд к центру
      let minDistance = Infinity;
      slides.forEach((slide) => {
        const slideRect = slide.getBoundingClientRect();
        const slideCenter = slideRect.left + slideRect.width / 2;
        const distanceToCenter = Math.abs(slideCenter - sliderCenter);

        if (distanceToCenter < minDistance) {
          minDistance = distanceToCenter;
          targetSlide = slide;
        }
      });
    }

    if (targetSlide) {
      const slideRect = targetSlide.getBoundingClientRect();
      const offset = (slideRect.left + slideRect.width / 2) - sliderCenter;

      slider.scrollBy({
        left: offset,
        behavior: 'smooth'
      });
      sliderState.currentSlideIndex = slides.indexOf(targetSlide);
    }
  }

export function setSlider (sliderName, slidesArray) {

  const slider = document.querySelector(sliderName);
  const slides = Array.from(document.querySelectorAll(slidesArray));

  let isDragging = false;
  let startX = 0;
  let scrollStart = 0;
  let maxSlideShift = 0;

  

  function getSlideCenterDistance() {
    if (slides.length < 2) return 0;
    const rect1 = slides[0].getBoundingClientRect();
    const rect2 = slides[1].getBoundingClientRect();
    const center1 = rect1.left + rect1.width / 2;
    const center2 = rect2.left + rect2.width / 2;
    const extraCoef = 50; //небольшой запас чтобы можно было чуть протащить за пределы
    maxSlideShift = Math.abs((center2 - center1) + extraCoef);

    return maxSlideShift;
  }

  slider.addEventListener('touchstart', (e) => {
    isDragging = true;
    startX = e.touches[0].clientX;
    scrollStart = slider.scrollLeft;
    getSlideCenterDistance();
  });

  slider.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    
    const x = e.touches[0].clientX;
    const rawDistance  = startX - x;
    const boostFactor = 1.2; // усиливаем свайп на 20%
    let boostedDistance = rawDistance * boostFactor;

    if (boostedDistance > maxSlideShift) boostedDistance = maxSlideShift;
    if (boostedDistance < -maxSlideShift) boostedDistance = -maxSlideShift;

    // console.log(rawDistance);
    // console.log(maxSlideShift);
    
    slider.scrollLeft = scrollStart + boostedDistance;
  });

  slider.addEventListener('touchend', () => {
    isDragging = false;
    // Определяем направление и центрируем нужный слайд
    centerClosestSlide(slider, slides);
  });

  

const resizeObserver = new ResizeObserver(() => {
  centerClosestSlide(slider, slides, 0); // твоя функция
});
resizeObserver.observe(slider);

  window.addEventListener('load', () => {
    centerClosestSlide(slider, slides, 0);
  });

  //window.addEventListener('resize', getSlideCenterDistance, centerClosestSlide(slider, slides, 0), console.log('resize')); //Оптимизация при ресайзе
}

export function setSliderTapZones(sliderSelector, slidesSelector, leftZone, rightZone) {
  const slider = document.querySelector(sliderSelector);
  const slides = Array.from(document.querySelectorAll(slidesSelector));
  const left = document.querySelector(leftZone);
  const right = document.querySelector(rightZone);
  
  function updateButtonStates() {
    if (right.tagName.toLowerCase() === 'button' && left.tagName.toLowerCase() === 'button') {
      if(sliderState.currentSlideIndex == 0) {
        left.setAttribute('disabled', "");
        console.log('disabled');
      }
      else if(sliderState.currentSlideIndex == slides.length - 1) {
        right.setAttribute('disabled', "");
      }
      else{
        right.removeAttribute('disabled', "");
        left.removeAttribute('disabled', "");
      }
    }
  } 
  
  updateButtonStates();

  left.addEventListener('click', () => {
    if (sliderState.currentSlideIndex > 0) {
      sliderState.currentSlideIndex--;
      centerClosestSlide(slider, slides, sliderState.currentSlideIndex);
      updateButtonStates();
      console.log(sliderState.currentSlideIndex);
    }
  });

  right.addEventListener('click', () => {
    if (sliderState.currentSlideIndex < slides.length - 1) {
      sliderState.currentSlideIndex++;
      centerClosestSlide(slider, slides, sliderState.currentSlideIndex);
      updateButtonStates();
    }
  });
}

export function setSliderPagination(sliderSelector, slidesSelector, buttonsSelector) {
  const slider = document.querySelector(sliderSelector);
  const slides = Array.from(document.querySelectorAll(slidesSelector));
  const buttons = document.querySelectorAll(buttonsSelector);

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      centerClosestSlide(slider, slides, index)
    });
  });

  sliderState.onChange = (val) => {
    buttons.forEach((button, index) => {
        button.classList.toggle('is-current', index === val);
      });
  };
}