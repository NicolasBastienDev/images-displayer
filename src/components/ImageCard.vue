<template>
    <v-card class="square-card">
        <v-card-title class="">
            <v-toolbar density="compact" :elevation="2" color="primary" :floating="true">
                <template v-slot:prepend>
                    <v-icon>mdi-folder-cog</v-icon>
                </template>
                <v-toolbar-title class="text-h6">Images parameter : {{ src.replace(SERVER_URL, '')
                    }}</v-toolbar-title>
                <v-spacer />
            </v-toolbar>
        </v-card-title>
        <v-card-text class="card">
            <v-row class="card-row" v-for="pair in pairs" :key="pair[0].path">
                <v-col v-for="image in pair" :key="image.path" cols="6">
                    <v-img class="square-image" :src="src + '/' + image"></v-img>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>
</template>

<script setup>
import { computed, onMounted, watch, ref } from 'vue';
const SERVER_URL = import.meta.env.VITE_SERVER_URL

const props = defineProps(['source'])
const src = ref(SERVER_URL)
const images = ref([])

onMounted(() => {
    src.value += props.source.path
    images.value = props.source.images
    console.log(images.value);
})

const pairs = computed(() => {
    const result = [];
    for (let i = 0; i < images.value.length; i += 2) {
        result.push([images.value[i], images.value[i + 1]]);
    }
    return result;
});



</script>

<style scoped>
.square-card {
    height: 15vw;
    width: 15vw;
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
</style>
