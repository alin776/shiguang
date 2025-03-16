<template>
  <div class="space-bg">
    <div class="space-particles"></div>
    <div class="space-stars"></div>
    <div class="floating-particles"></div>
  </div>
</template>

<style scoped>
.space-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e6f2ff, #f0f9ff);
  z-index: -10;
  overflow: hidden;
  pointer-events: none;
}

.space-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(
      circle at 80% 10%,
      rgba(74, 144, 226, 0.1) 0%,
      transparent 25%
    ),
    radial-gradient(
      circle at 20% 30%,
      rgba(86, 204, 242, 0.1) 0%,
      transparent 20%
    ),
    radial-gradient(
      circle at 30% 70%,
      rgba(74, 144, 226, 0.1) 0%,
      transparent 30%
    ),
    radial-gradient(
      circle at 70% 80%,
      rgba(86, 204, 242, 0.1) 0%,
      transparent 25%
    );
  opacity: 0.7;
}

.space-stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(
      1px 1px at 20px 30px,
      rgba(74, 144, 226, 0.5) 50%,
      transparent
    ),
    radial-gradient(
      1px 1px at 40px 70px,
      rgba(86, 204, 242, 0.4) 50%,
      transparent
    ),
    radial-gradient(
      1px 1px at 50px 160px,
      rgba(74, 144, 226, 0.5) 50%,
      transparent
    ),
    radial-gradient(
      1px 1px at 90px 40px,
      rgba(86, 204, 242, 0.4) 50%,
      transparent
    ),
    radial-gradient(
      1px 1px at 130px 80px,
      rgba(74, 144, 226, 0.5) 50%,
      transparent
    ),
    radial-gradient(
      1px 1px at 160px 120px,
      rgba(86, 204, 242, 0.4) 50%,
      transparent
    );
  background-repeat: repeat;
  background-size: 200px 200px;
  opacity: 0.4;
  animation: twinkle 5s infinite ease-in-out alternate;
}

.floating-particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: -2;
}

.floating-particles::before,
.floating-particles::after {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  --particle-color-1: rgba(74, 144, 226, 0.4);
  --particle-color-2: rgba(86, 204, 242, 0.4);
  --particle-color-3: rgba(74, 144, 226, 0.2);
  background-image: radial-gradient(
      circle at 10% 10%,
      var(--particle-color-1) 0%,
      transparent 8px
    ),
    radial-gradient(
      circle at 30% 20%,
      var(--particle-color-2) 0%,
      transparent 5px
    ),
    radial-gradient(
      circle at 50% 30%,
      var(--particle-color-3) 0%,
      transparent 7px
    ),
    radial-gradient(
      circle at 70% 40%,
      var(--particle-color-1) 0%,
      transparent 6px
    ),
    radial-gradient(
      circle at 90% 50%,
      var(--particle-color-2) 0%,
      transparent 5px
    ),
    radial-gradient(
      circle at 80% 70%,
      var(--particle-color-3) 0%,
      transparent 8px
    ),
    radial-gradient(
      circle at 60% 80%,
      var(--particle-color-1) 0%,
      transparent 7px
    ),
    radial-gradient(
      circle at 40% 90%,
      var(--particle-color-2) 0%,
      transparent 6px
    ),
    radial-gradient(
      circle at 20% 60%,
      var(--particle-color-3) 0%,
      transparent 5px
    );
  background-size: 150% 150%;
  opacity: 0.15;
  animation: float-particles 60s infinite linear;
}

.floating-particles::after {
  background-image: radial-gradient(
      circle at 85% 15%,
      var(--particle-color-1) 0%,
      transparent 6px
    ),
    radial-gradient(
      circle at 65% 35%,
      var(--particle-color-2) 0%,
      transparent 7px
    ),
    radial-gradient(
      circle at 45% 55%,
      var(--particle-color-3) 0%,
      transparent 5px
    ),
    radial-gradient(
      circle at 25% 75%,
      var(--particle-color-1) 0%,
      transparent 7px
    ),
    radial-gradient(
      circle at 5% 95%,
      var(--particle-color-2) 0%,
      transparent 5px
    ),
    radial-gradient(
      circle at 15% 45%,
      var(--particle-color-3) 0%,
      transparent 7px
    ),
    radial-gradient(
      circle at 35% 25%,
      var(--particle-color-1) 0%,
      transparent 6px
    ),
    radial-gradient(
      circle at 55% 5%,
      var(--particle-color-2) 0%,
      transparent 5px
    ),
    radial-gradient(
      circle at 75% 85%,
      var(--particle-color-3) 0%,
      transparent 6px
    );
  animation-duration: 80s;
  animation-direction: reverse;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.4;
  }
}

@keyframes float-particles {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 100% 100%;
  }
}
</style>
