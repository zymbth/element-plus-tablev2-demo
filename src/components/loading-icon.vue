<template>
  <div class="el-loading-mask" style="display: flex; align-items: center; justify-content: center">
    <svg
      class="loading-icon"
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      width="50"
      height="50">
      <path
        d="M85.33300000000003 512a426.667 426.667 0 1 0 853.334 0 426.667 426.667 0 1 0-853.334 0z"
        fill="#959BA7"
        fill-opacity=".3" />
      <path
        d="M938.667 512c0-235.648-191.019-426.667-426.667-426.667V512h426.667z"
        fill="#387FE5"
        data-spm-anchor-id="a313x.7781069.0.i3"
        class="selected" />
      <path d="M192 512a320 320 0 1 0 640 0 320 320 0 1 0-640 0z" fill="#FFF" />
    </svg>
  </div>
</template>
<style lang="scss" scoped>
@keyframes rotating {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}
.loading-icon {
  animation: rotating 2s linear infinite;
}
</style>
