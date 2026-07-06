<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden="true">
    <img v-for="item in logos" :key="item.id"
      :src="item.src"
      :style="{
        position: 'absolute',
        width: item.size + 'px',
        opacity: 0.07,
        filter: 'blur(3px)',
        top: item.top,
        left: item.left,
        transform: `rotate(${item.rotate}deg)`,
      }"
    />
  </div>
</template>

<script setup lang="ts">
const logos = [
  { id: 1, src: '/bg-logo-3.png', size: 180, top: '5%',  left: '5%',  rotate: -12 },
  { id: 2, src: '/bg-logo-1.png', size: 150, top: '8%',  left: '55%', rotate: 8  },
  { id: 3, src: '/bg-logo-5.png', size: 200, top: '20%', left: '78%', rotate: -6 },
  { id: 4, src: '/bg-logo-2.png', size: 160, top: '38%', left: '12%', rotate: 10 },
  { id: 5, src: '/bg-logo-4.png', size: 190, top: '42%', left: '60%', rotate: -15},
  { id: 6, src: '/bg-logo-1.png', size: 140, top: '60%', left: '30%', rotate: 5  },
  { id: 7, src: '/bg-logo-3.png', size: 170, top: '68%', left: '80%', rotate: 12 },
  { id: 8, src: '/bg-logo-5.png', size: 155, top: '80%', left: '2%',  rotate: -8 },
  { id: 9, src: '/bg-logo-2.png', size: 165, top: '85%', left: '50%', rotate: 7  },
];
</script>
