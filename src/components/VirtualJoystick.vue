<template>
  <div
    class="joystick-container"
    :style="{ width: size + 'px', height: size + 'px' }"
    @mousedown="startDrag"
    @touchstart="startDrag"
    @mousemove="onDrag"
    @touchmove="onDrag"
    @mouseup="stopDrag"
    @touchend="stopDrag"
    @mouseleave="stopDrag"
  >
    <div
      class="joystick-base"
      :style="{
        width: size + 'px',
        height: size + 'px',
        backgroundColor: baseColor
      }"
    ></div>
    <div
      class="joystick-stick"
      :style="{
        width: stickSize + 'px',
        height: stickSize + 'px',
        transform: `translate(${position.x}px, ${position.y}px)`,
        backgroundColor: stickColor
      }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  size?: number
  stickSize?: number
  baseColor?: string
  stickColor?: string
}>()

const emit = defineEmits<{
  (e: 'update', x: number, y: number): void
}>()

const size = computed(() => props.size || 150)
const stickSize = computed(() => props.stickSize || 60)
const baseColor = computed(() => props.baseColor || '#2c3e50')
const stickColor = computed(() => props.stickColor || '#42b983')

const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const containerRect = ref<DOMRect | null>(null)

const startDrag = (event: MouseEvent | TouchEvent) => {
  isDragging.value = true
  const container = event.currentTarget as HTMLElement
  containerRect.value = container.getBoundingClientRect()
  updatePosition(event)
}

const onDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return
  updatePosition(event)
}

const stopDrag = () => {
  isDragging.value = false
  position.value = { x: 0, y: 0 }
  emit('update', 0, 0)
}

const updatePosition = (event: MouseEvent | TouchEvent) => {
  if (!containerRect.value) return

  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  const centerX = containerRect.value.left + size.value / 2
  const centerY = containerRect.value.top + size.value / 2

  let x = clientX - centerX
  let y = clientY - centerY

  // Ограничиваем движение джойстика кругом
  const maxDistance = (size.value - stickSize.value) / 2
  const distance = Math.sqrt(x * x + y * y)
  
  if (distance > maxDistance) {
    const angle = Math.atan2(y, x)
    x = Math.cos(angle) * maxDistance
    y = Math.sin(angle) * maxDistance
  }

  position.value = { x, y }

  // Нормализуем значения от -1 до 1
  const normalizedX = x / maxDistance
  const normalizedY = y / maxDistance

  emit('update', normalizedX, normalizedY)
}

// Очистка при размонтировании
onUnmounted(() => {
  stopDrag()
})
</script>

<style scoped>
.joystick-container {
  position: relative;
  touch-action: none;
  user-select: none;
}

.joystick-base {
  position: absolute;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.joystick-stick {
  position: absolute;
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
}

.joystick-stick:active {
  cursor: grabbing;
}
</style> 