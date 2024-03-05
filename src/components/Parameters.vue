<template>
    <v-col cols="6">
        <v-row>
            <Treeselect v-model="value" :multiple="true" :options="props.directories" />
        </v-row>
    </v-col>
</template>

<script setup>
import { ref, watch } from 'vue'
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'
const SERVER_URL = import.meta.env.VITE_SERVER_URL

const value = ref(null)
const sources = ref([])

const emits = defineEmits(['update:parameters'])
const props = defineProps(['directories'])


watch(value, (newVal, oldVal) => {
    let paths = [];

    newVal.forEach((val) => {
        paths.push(...getAllPathsForLabel(props.directories, val));
    });

    paths = paths.filter((path, index) => paths.indexOf(path) === index);

    sources.value = paths
    emits('update:parameters', sources.value)
    // getImages(sources.value)
});

// const getImages = (paths) => {
//     paths.forEach((path) => {
//         console.log(path);
//     })
// }


const getAllPathsForLabel = (objArray, targetLabel) => {
    function getPaths(obj, currentPath) {
        currentPath.push(obj.label);

        if (!obj.children || obj.children.length === 0) {
            const fullPath = currentPath.join('/');

            if (currentPath.includes(targetLabel)) {
                paths.push({
                    path: fullPath,
                    images: obj.images
                });
            }
        }

        if (obj.children && obj.children.length > 0) {
            for (const child of obj.children) {
                getPaths(child, currentPath.slice());
            }
        }
    }

    const paths = [];

    for (const obj of objArray) {
        getPaths(obj, []);
    }

    return paths;
}
</script>

<style scoped></style>