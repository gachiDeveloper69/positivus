const sliderState = {
  _currentSlideIndex: 0,
  _listeners: [],

  get currentSlideIndex() {
    return this._currentSlideIndex;
  },

  set currentSlideIndex(value) {
    this._currentSlideIndex = value;
    this._listeners.forEach((fn) => fn(value));
  },

  onChange(fn) {
    if (typeof fn === 'function') {
      this._listeners.push(fn);
    }
  }
};


export function centerClosestSlide(slider, slides, slideIndex = null, allowBounce = true) {
    const sliderRect = slider.getBoundingClientRect();
    const sliderCenter = sliderRect.left + sliderRect.width / 2;

    let targetSlide;
    const bouncing = allowBounce;

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
      let isRight;

      sliderState.onChange((val) => {
        const currentSlide = sliderState._currentSlideIndex;
        isRight = val > currentSlide;
      });
      
      function scrollSlider(slider, targetOffset) {
        return new Promise((resolve) => {
          const target = slider.scrollLeft + targetOffset;

          function checkScrollEnd() {
            const reached = Math.abs(slider.scrollLeft - target) < 1;
            if (reached) {
              slider.removeEventListener('scroll', checkScrollEnd);
              resolve();
            }
          }

          slider.addEventListener('scroll', checkScrollEnd);
          // Триггерим скролл
          slider.scrollBy({
            left: targetOffset,
            behavior: 'smooth',
          });

          // Подстраховка, если scroll не сработает
          setTimeout(() => {
            slider.removeEventListener('scroll', checkScrollEnd);
            resolve();
          }, 1000); // максимум на 1 сек
        });
      }
      function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
      async function asyncScroll(bounceDistance, delayTime = 1000) {
        
        const bounce = bouncing ? bounceDistance : 0;
        const bounceOffset = (offset > 0 || isRight) ? offset + bounce : offset - bounce;
        const backOffset = (offset > 0 || isRight) ? -bounce : bounce;

        await scrollSlider(slider, bounceOffset);
        await delay(delayTime); // подождали только после завершения scroll

        await scrollSlider(slider, backOffset);
      }
      /*
      function scrollSlider (bounce, delayTime = 1000) {
        if(!bounce || Math.abs(offset) <= Math.abs(bounce)) {
            slider.scrollBy({
            left: offset,
            behavior: 'smooth'
          });
          console.log(isRight);
          console.log(offset);
        }
        else {
          function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
          }
          async function asyncScroll () {
            slider.scrollBy({
              left: (offset > 0 || isRight) ? offset + bounce : offset - bounce,
              behavior: 'smooth'
            });
            await delay(delayTime); // подождали секунду
            slider.scrollBy({
              left: (offset > 0 || isRight) ? bounce * -1 : bounce,
              behavior: 'smooth'
            });
          }
          asyncScroll();
        }
      }
    */
    if (window.innerWidth >= 768) {
      asyncScroll(150, 15);
    } else {
      asyncScroll(80, 1);
    }
    //asyncScroll(150, 15);
    sliderState.currentSlideIndex = slides.indexOf(targetSlide);
    /*
    slider.scrollBy({
      left: offset,
      behavior: 'smooth'
    });
    sliderState.currentSlideIndex = slides.indexOf(targetSlide);
    */
  }
}

export function setSlider (sliderName, slidesArray) {

  const slider = document.querySelector(sliderName);
  const slides = Array.from(document.querySelectorAll(slidesArray));

  let isDragging = false;
  let startX = 0;
  let scrollStart = 0;
  let maxSlideShift = 0;
  const isTouchDevice = navigator.maxTouchPoints > 0;
  

  function getSlideCenterDistance() {
    if (slides.length < 2) return 0;
    const rect1 = slides[0].getBoundingClientRect();
    const rect2 = slides[1].getBoundingClientRect();
    const center1 = rect1.left + rect1.width / 2;
    const center2 = rect2.left + rect2.width / 2;
    const extraCoef = 100; //небольшой запас чтобы можно было чуть протащить за пределы
    maxSlideShift = Math.abs((center2 - center1) + extraCoef);

    return maxSlideShift;
  }

  function dragStart(e) {
    isDragging = true;
    slider.style.cursor = "grabbing";

    //определения координаты X при нажатии мыши или касании
    startX = e.pageX || e.touches[0].clientX;
    scrollStart = slider.scrollLeft;
    getSlideCenterDistance();
  }

  function dragMove(e) {
    if (!isDragging) return;
    
    
    const x = e.pageX || e.touches[0].clientX;
    const rawDistance  = startX - x;
    const boostFactor =  isTouchDevice ? 1.2 : 1; // усиливаем свайп на 20% только для тача
    let boostedDistance = rawDistance * boostFactor;

    if (boostedDistance > maxSlideShift) boostedDistance = maxSlideShift;
    if (boostedDistance < -maxSlideShift) boostedDistance = -maxSlideShift;
    
    slider.scrollLeft = scrollStart + boostedDistance;
  }

  function dragEnd() {
    isDragging = false;
    slider.style.cursor = "grab";
    // Определяем направление и центрируем нужный слайд
    centerClosestSlide(slider, slides);
  }

  if (isTouchDevice){
    slider.addEventListener("touchstart", dragStart);
    slider.addEventListener("touchmove", dragMove);
    slider.addEventListener("touchend", dragEnd);
  } else {
    slider.addEventListener("mousedown", dragStart);
    slider.addEventListener("mousemove", dragMove);
    slider.addEventListener("mouseup", dragEnd);
    slider.addEventListener("mouseleave", () => { if (isDragging) dragEnd(); });
  }
  
  
  /*
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
  */
  

const resizeObserver = new ResizeObserver(() => {
  centerClosestSlide(slider, slides, 0, false); 
});
resizeObserver.observe(slider);

  window.addEventListener('load', () => {
    centerClosestSlide(slider, slides, 0, false);
  });

}

export function setSliderTapZones(sliderSelector, slidesSelector, leftZone, rightZone) {
  const slider = document.querySelector(sliderSelector);
  const slides = Array.from(document.querySelectorAll(slidesSelector));
  const left = document.querySelector(leftZone);
  const right = document.querySelector(rightZone);
  
  sliderState.onChange((val) => {
    // Деактивация стрелок
    if (val === 0) {
      left.setAttribute('disabled', '');
    } else {
      left.removeAttribute('disabled');
    }

    if (val === slides.length - 1) {
      right.setAttribute('disabled', '');
    } else {
      right.removeAttribute('disabled');
    }
  });
  

  left.addEventListener('click', () => {
    if (sliderState.currentSlideIndex > 0) {
      sliderState.currentSlideIndex--;
      centerClosestSlide(slider, slides, sliderState.currentSlideIndex);
      console.log(sliderState.currentSlideIndex);
    }
  });

  right.addEventListener('click', () => {
    if (sliderState.currentSlideIndex < slides.length - 1) {
      sliderState.currentSlideIndex++;
      centerClosestSlide(slider, slides, sliderState.currentSlideIndex);
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

  sliderState.onChange((val) => {
    buttons.forEach((button, index) => {
        button.classList.toggle('is-current', index === val);
      });
  });
}