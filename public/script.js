// Генерация случайных кругов
// eslint-disable

function createRandomCircle() {
  const circle = document.createElement("div");
  circle.classList.add("circle");
  circle.style.left = `${Math.random() * 100}vw`;
  circle.style.top = `${Math.random() * 100}vh`;
  circle.style.width = `${Math.random() * 100}px`;
  circle.style.height = circle.style.width;
  document.querySelector(".background").appendChild(circle);
}

// Генерация случайных кругов каждые 2 секунды
setInterval(createRandomCircle, 2000);
