<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden="true">

    <!-- Logo images — crisp, no blur -->
    <img v-for="item in logoItems" :key="item.id"
      :src="item.src"
      :style="{
        position: 'absolute',
        width: item.size + 'px',
        opacity: item.opacity,
        top: item.top,
        left: item.left,
        transform: `rotate(${item.rotate}deg)`,
        filter: 'drop-shadow(0 4px 12px rgba(109,40,217,0.15))',
      }"
    />

    <!-- Decorative stars -->
    <svg v-for="star in stars" :key="'star-' + star.id"
      :style="{
        position: 'absolute',
        width: star.size + 'px',
        height: star.size + 'px',
        top: star.top,
        left: star.left,
        transform: `rotate(${star.rotate}deg)`,
        opacity: star.opacity,
        filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.15))',
      }"
      viewBox="0 0 50 50" fill="none"
    >
      <polygon
        points="25,2 30.9,17.6 47.6,18.2 35,28.3 39.1,44.7 25,35.5 10.9,44.7 15,28.3 2.4,18.2 19.1,17.6"
        :fill="star.color"
      />
    </svg>

    <!-- Floating mini-card shapes -->
    <div v-for="card in cardShapes" :key="'card-' + card.id"
      :style="{
        position: 'absolute',
        width: card.w + 'px',
        height: card.h + 'px',
        top: card.top,
        left: card.left,
        transform: `rotate(${card.rotate}deg)`,
        opacity: card.opacity,
        background: 'rgba(255,255,255,0.65)',
        borderRadius: '12px',
        backdropFilter: 'blur(2px)',
        boxShadow: '0 4px 16px rgba(109,40,217,0.12)',
      }"
    />

    <!-- Decorative cloud/blob shapes -->
    <svg v-for="blob in blobs" :key="'blob-' + blob.id"
      :style="{
        position: 'absolute',
        width: blob.size + 'px',
        height: blob.size + 'px',
        top: blob.top,
        left: blob.left,
        transform: `rotate(${blob.rotate}deg)`,
        opacity: blob.opacity,
      }"
      viewBox="0 0 80 60" fill="none"
    >
      <ellipse cx="30" cy="35" rx="28" ry="22" :fill="blob.color" />
      <ellipse cx="50" cy="30" rx="22" ry="18" :fill="blob.color" />
      <ellipse cx="20" cy="30" rx="18" ry="15" :fill="blob.color" />
    </svg>

  </div>
</template>

<script setup lang="ts">
const logoItems = [
  { id: 1, src: '/bg-logo-3.png', size: 120, opacity: 0.22, top: '4%',  left: '3%',   rotate: -8  },
  { id: 2, src: '/bg-logo-1.png', size: 100, opacity: 0.20, top: '6%',  left: '52%',  rotate: 10  },
  { id: 3, src: '/bg-logo-5.png', size: 130, opacity: 0.18, top: '18%', left: '80%',  rotate: -5  },
  { id: 4, src: '/bg-logo-2.png', size: 110, opacity: 0.22, top: '40%', left: '8%',   rotate: 12  },
  { id: 5, src: '/bg-logo-4.png', size: 120, opacity: 0.18, top: '45%', left: '65%',  rotate: -14 },
  { id: 6, src: '/bg-logo-1.png', size: 95,  opacity: 0.16, top: '62%', left: '35%',  rotate: 6   },
  { id: 7, src: '/bg-logo-3.png', size: 115, opacity: 0.18, top: '70%', left: '82%',  rotate: 10  },
  { id: 8, src: '/bg-logo-5.png', size: 100, opacity: 0.20, top: '82%', left: '1%',   rotate: -6  },
  { id: 9, src: '/bg-logo-2.png', size: 110, opacity: 0.16, top: '86%', left: '55%',  rotate: 8   },
];

const stars = [
  { id: 1,  size: 52, color: '#A5F3FC', opacity: 0.85, top: '2%',  left: '18%', rotate: 15  },
  { id: 2,  size: 44, color: '#F9A8D4', opacity: 0.80, top: '1%',  left: '40%', rotate: -20 },
  { id: 3,  size: 60, color: '#C4B5FD', opacity: 0.75, top: '3%',  left: '72%', rotate: 8   },
  { id: 4,  size: 38, color: '#FCD34D', opacity: 0.80, top: '12%', left: '90%', rotate: 30  },
  { id: 5,  size: 48, color: '#86EFAC', opacity: 0.70, top: '30%', left: '-1%', rotate: -10 },
  { id: 6,  size: 55, color: '#F9A8D4', opacity: 0.75, top: '55%', left: '91%', rotate: 18  },
  { id: 7,  size: 42, color: '#A5F3FC', opacity: 0.80, top: '72%', left: '20%', rotate: -25 },
  { id: 8,  size: 50, color: '#FCD34D', opacity: 0.75, top: '80%', left: '68%', rotate: 12  },
  { id: 9,  size: 36, color: '#C4B5FD', opacity: 0.80, top: '90%', left: '40%', rotate: -8  },
  { id: 10, size: 46, color: '#F9A8D4', opacity: 0.70, top: '22%', left: '45%', rotate: 22  },
];

const cardShapes = [
  { id: 1, w: 130, h: 36, opacity: 0.55, top: '16%', left: '54%', rotate: -2  },
  { id: 2, w: 110, h: 32, opacity: 0.45, top: '22%', left: '55%', rotate: 1   },
  { id: 3, w: 120, h: 34, opacity: 0.50, top: '60%', left: '10%', rotate: 3   },
  { id: 4, w: 140, h: 36, opacity: 0.45, top: '75%', left: '50%', rotate: -3  },
];

const blobs = [
  { id: 1, size: 72, color: '#DDD6FE', opacity: 0.60, top: '8%',  left: '88%', rotate: 0  },
  { id: 2, size: 60, color: '#E9D5FF', opacity: 0.55, top: '35%', left: '93%', rotate: 15 },
  { id: 3, size: 65, color: '#DDD6FE', opacity: 0.50, top: '88%', left: '14%', rotate: -5 },
];
</script>
