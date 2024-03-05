<template>
    <v-dialog persistent :no-click-animation="props.lightBoxOpen" v-model="isShown" width="auto">
        <v-card class="square-card ma-5">
            <v-card-title class="pa-0">
                <v-toolbar density="compact" :elevation="2" color="primary" :floating="true">
                    <template v-slot:prepend>
                        <v-icon>mdi-folder-cog</v-icon>
                    </template>
                    <v-toolbar-title class="text-h6">Images parameter : {{ src.replace(SERVER_URL, '')
                        }}</v-toolbar-title>
                    <v-spacer />

                    <template v-slot:append>
                        <v-icon color="red" @click="close">mdi-close-circle</v-icon>

                    </template>
                </v-toolbar>
            </v-card-title>
            <v-card-text class="card">
                <v-row class="card-row" v-for="pair in pairs" :key="pair[0].path">
                    <v-col v-for="image in pair" :key="image.path" cols="6">
                        <v-img class="square-image" :src="src + '/' + image"
                            @click="handleImageClick(src, images, image)"></v-img>
                    </v-col>
                </v-row>
            </v-card-text>
            <!-- <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue-darken-1" variant="text" @click="close">
                    Close
                </v-btn>
            </v-card-actions> -->
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
const SERVER_URL = import.meta.env.VITE_SERVER_URL

const isShown = ref(false)
let resolvePromise = null

const src = ref(SERVER_URL)

const emits = defineEmits(['clicked:image'])
const props = defineProps(['lightBoxOpen'])

const images = ref([])

const handleImageClick = (src, images, image) => {
    const index = images.indexOf(image)
    console.log(index);
    emits('clicked:image', src, images, index)
}

const show = async (source) => {
    images.value = source.images
    src.value += source.path
    isShown.value = true


    return new Promise((resolve) => {
        resolvePromise = resolve
    })
}

const pairs = computed(() => {
    const result = [];
    for (let i = 0; i < images.value.length; i += 2) {
        result.push([images.value[i], images.value[i + 1]]);
    }
    return result;
});


const close = () => {
    reset()
    isShown.value = false
    resolvePromise(false)
}

const reset = () => {
    src.value = SERVER_URL
    images.value = []
}

defineExpose({ show })
</script>

<style scoped>
.square-card {
    height: 90vh;
    width: 90vh;
}

.card {
    width: 100%;
    height: 100%;
}

.card-row {
    min-height: 50%;
}

.square-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.square-image:hover {
    cursor: pointer;
}
</style>