<template>
    <DomZoom>
        <img alt="Vue logo" src="./assets/logo.png" />
    </DomZoom>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import DomZoom from "./components/DomZoom.vue";

export default defineComponent({
    name: "App",
    components: {
        DomZoom
    }
});
</script>

<style scoped>
    img {
        -webkit-user-drag: none;
    }
</style>
