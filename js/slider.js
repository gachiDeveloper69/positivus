const slider = document.querySelector('.studies__list');
const slides = Array.from(document.querySelectorAll('.studies__item'));

let isDragging = false;
let startX = 0;
let scrollStart = 0;
let maxSlideShift = 0;

let currentSlideIndex = 0;

function getSlideCenterDistance() {
  if (slides.length < 2) return 0;
  const rect1 = slides[0].getBoundingClientRect();
  const rect2 = slides[1].getBoundingClientRect();
  const center1 = rect1.left + rect1.width / 2;
  const center2 = rect2.left + rect2.width / 2;
  extraCoef = 50; //небольшой запас чтобы можно было чуть протащить за пределы
  maxSlideShift = Math.abs((center2 - center1) + extraCoef);

  return maxSlideShift;
}

document.querySelector('.tap-zone--left').addEventListener('click', () => {
  if (currentSlideIndex > 0) {
    currentSlideIndex--;
    centerClosestSlide(slider, slides, currentSlideIndex);
  }
});

document.querySelector('.tap-zone--right').addEventListener('click', () => {
  if (currentSlideIndex < slides.length - 1) {
    currentSlideIndex++;
    centerClosestSlide(slider, slides, currentSlideIndex);
  }
});

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

function centerClosestSlide(slider, slides, slideIndex = null) {
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
    currentSlideIndex = slides.indexOf(targetSlide);
  }
}

window.addEventListener('load', () => {
  centerClosestSlide(slider, slides, 0);
});

window.addEventListener('resize', getSlideCenterDistance); //Оптимизация при ресайзе

