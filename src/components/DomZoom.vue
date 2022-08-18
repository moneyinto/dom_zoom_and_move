<template>
    <div class="zoom-view-box"
        @touchstart="($event) => touchStartListener($event)"
        @touchend="($event) => touchEndListener($event)"
        @touchmove="($event) => touchMoveListener($event)"
    >
        <div
            class="zoom-move-content"
            ref="zoomMoveRef"
            :style="{
                width: contentWidth + 'px',
                height: contentHeight + 'px',
                marginLeft: offsetX + 'px',
                marginTop: offsetY + 'px'
            }"
        >
            <div
                class="content-box"
                ref="contentRef"
                @mousewheel="($event) => handleMousewheelScreen($event)"
                @mousemove="handleMouseMove"
                @mousedown="($event) => moveScreen($event)"
                :style="{
                    transform: `scale(${scale})`
                }"
            >
                <slot />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";

export default defineComponent({
    setup() {
        const contentWidth = ref(0);
        const contentHeight = ref(0);
        const offsetX = ref(0);
        const offsetY = ref(0);
        const scale = ref(1);
        const contentRef = ref();
        const zoomMoveRef = ref();
        const setSlideContentSize = () => {
            contentWidth.value = contentRef.value.clientWidth;
            contentHeight.value = contentRef.value.clientHeight;
            console.log(contentHeight.value, contentWidth.value);
        };
        const resizeObserver = new ResizeObserver(setSlideContentSize);
        onMounted(() => {
            resizeObserver.observe(contentRef.value);
        });

        // 获取目标dom左上角距离视窗左边和上边的距离
        const getDomOffset = () => {
            const width = zoomMoveRef.value.clientWidth;
            const height = zoomMoveRef.value.clientHeight;
            const offsetX = zoomMoveRef.value.offsetLeft - width / 2;
            const offsetY = zoomMoveRef.value.offsetTop - height / 2;
            return { offsetX, offsetY };
        };

        // 获取中心点距离可视窗左边和上边距离
        const getPointOffset = (point: { x: number; y: number }) => {
            const { offsetX, offsetY } = getDomOffset();
            return {
                offsetX: (point.x - offsetX) / scale.value,
                offsetY: (point.y - offsetY) / scale.value
            };
        };

        let unit = 0.05;
        let isMove = false;
        const handleMousewheelScreen = (e: WheelEvent) => {
            e.preventDefault();
            if (isMove) return;
            if (e.deltaY > 0) {
                if (scale.value === 1) return;
                // 缩小
                scale.value -= unit;
                offsetX.value = e.offsetX * unit + offsetX.value;
                offsetY.value = e.offsetY * unit + offsetY.value;
            } else {
                // 放大
                scale.value += unit;
                offsetX.value = -e.offsetX * unit + offsetX.value;
                offsetY.value = -e.offsetY * unit + offsetY.value;
            }
        };

        let timer: number;
        // 鼠标移动时禁止缩放
        const moveEnd = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                isMove = false;
            }, 300);
        };

        const handleMouseMove = () => {
            isMove = true;
            moveEnd();
        };

        // 移动
        const moveScreen = (e: MouseEvent) => {
            if (scale.value === 1 && offsetX.value === 0 && offsetY.value === 0)
                return;
            let isMouseDown = true;
            const startPageX = e.pageX;
            const startPageY = e.pageY;

            // 初始移动距离
            const moveScreenX = offsetX.value;
            const moveScreenY = offsetY.value;

            // 开始移动
            document.onmousemove = (e) => {
                if (!isMouseDown) return;

                const currentPageX = e.pageX;
                const currentPageY = e.pageY;

                offsetX.value = currentPageX - startPageX + moveScreenX;
                offsetY.value = currentPageY - startPageY + moveScreenY;
            };

            document.onmouseup = () => {
                isMouseDown = false;
                document.onmousemove = null;
                document.onmouseup = null;
            };
        };

        // 获取两指间距离
        const getDistance = (
            start: { x: number; y: number },
            stop: { x: number; y: number }
        ) => {
            return Math.hypot(stop.x - start.x, stop.y - start.y);
        };

        // 获取两指中心点
        const getTouchesCenter = (touchList: TouchList) => {
            const pointOne = touchList[0];
            const pointTwo = touchList[1];
            return {
                x: (pointOne.pageX + pointTwo.pageX) / 2,
                y: (pointOne.pageY + pointTwo.pageY) / 2
            };
        };

        const touchInfo = ref<TouchList | null>(null);
        let center: { x: number; y: number };
        const touchStartListener = (e: TouchEvent) => {
            touchInfo.value = e.touches;
            if (e.touches.length === 2) {
                center = getTouchesCenter(e.touches);
            }
        };

        const touchEndListener = (e: TouchEvent) => {
            if (!touchInfo.value) return;
        };

        const touchMoveListener = (e: TouchEvent) => {
            e.preventDefault();
            if (touchInfo.value?.length === 2 && e.touches.length === 2) {
                // 双指缩放
                const zoom =
                    getDistance(
                        { x: e.touches[0].pageX, y: e.touches[0].pageY },
                        { x: e.touches[1].pageX, y: e.touches[1].pageY }
                    ) /
                    getDistance(
                        {
                            x: touchInfo.value[0].pageX,
                            y: touchInfo.value[0].pageY
                        },
                        {
                            x: touchInfo.value[1].pageX,
                            y: touchInfo.value[1].pageY
                        }
                    );
                touchInfo.value = e.touches;
                const offset = getPointOffset(center);
                if (zoom - 1 < 0) {
                    if (scale.value === 1) return;
                    // 缩小
                    scale.value -= unit;
                    offsetX.value = offset.offsetX * unit + offsetX.value;
                    offsetY.value = offset.offsetY * unit + offsetY.value;
                } else if (zoom - 1 > 0) {
                    // 放大
                    scale.value += unit;
                    offsetX.value = -offset.offsetX * unit + offsetX.value;
                    offsetY.value = -offset.offsetY * unit + offsetY.value;
                }
            } else if (
                touchInfo.value?.length === 1 &&
                e.touches.length === 1
            ) {
                if (
                    scale.value === 1 &&
                    offsetX.value === 0 &&
                    offsetY.value === 0
                )
                    return;
                // 移动
                const moveScreenX = offsetX.value;
                const moveScreenY = offsetY.value;
                offsetX.value =
                    e.touches[0].pageX - touchInfo.value[0].pageX + moveScreenX;
                offsetY.value =
                    e.touches[0].pageY - touchInfo.value[0].pageY + moveScreenY;
                touchInfo.value = e.touches;
            }
        };

        return {
            contentWidth,
            contentHeight,
            offsetX,
            offsetY,
            scale,
            contentRef,
            zoomMoveRef,
            handleMousewheelScreen,
            handleMouseMove,
            moveScreen,
            touchStartListener,
            touchEndListener,
            touchMoveListener
        };
    }
});
</script>

<style scoped>
.zoom-view-box {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
}

.content-box {
    transform-origin: left top;
}

.zoom-move-content {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    transform-origin: center center;
}
</style>
