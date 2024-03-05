<template>
    <CardDialog :light-box-open="isLightBoxOpen" ref="cardDialog" @clicked:image="clickedImage"></CardDialog>
    <FsLightbox :toggler="lightBoxToggler" type="image" :onClose="lightBoxClosed" :onOpen="lightBoxOpened"
        :slide="slide + 1" :sources="lightBoxSources">
    </FsLightbox>
    <v-container fluid tag="section">
        <v-row>
            <v-col cols="12">
                <v-card class="images-options">
                    <v-card-title class="pa-0">
                        <v-toolbar density="compact" :elevation="2" color="primary" :floating="true">
                            <template v-slot:prepend>
                                <v-icon>mdi-alien</v-icon>
                            </template>
                            <v-toolbar-title class="text-h6">Images option</v-toolbar-title>
                            <v-spacer />

                            <!-- <template v-slot:append>
                                <v-btn variant="tonal" rounded @click="addImages()">
                                    <v-icon>mdi-image-plus-outline</v-icon>
                                </v-btn>
                            </template> -->
                        </v-toolbar>
                    </v-card-title>
                    <v-card-text>
                        <v-row>
                            <v-col cols="12">
                                <Parameters @update:parameters="updateParameters" :directories="directories"
                                    class="ma-5">
                                </Parameters>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="12">
                                Add files :
                            </v-col>
                            <v-col>
                                <div ref="dz" id="dropZone" class="dropzone">
                                </div>
                            </v-col>
                        </v-row>

                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-card class="mt-2">
            <v-card-title class="pa-0">
                <v-toolbar density="compact" :elevation="2" color="primary" :floating="true">

                    <template v-slot:prepend>
                        <v-icon>mdi-image-multiple-outline</v-icon>
                    </template>
                    <v-toolbar-title class="text-h6">Images displayer</v-toolbar-title>
                </v-toolbar>
            </v-card-title>
            <!-- <v-row>
                <v-col cols="4" class="images-displayer">
                    <div class="image-card-container pa-5" v-for="source in sources">
                        <ImageCard :source="source" @click="openCardDialog(source)">
                        </ImageCard>
                    </div>
                </v-col>
            </v-row> -->
            <v-card-text class="images-displayer">
                <v-row class="mt-2">
                    <v-col v-for="source in sources" cols="2">
                        <ImageCard :source @click="openCardDialog(source)"></ImageCard>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import Parameters from '@/components/Parameters.vue'
import AddImagesDialog from '@/components/AddImagesDialog.vue'
import ImageCard from '@/components/ImageCard.vue'
import CardDialog from '@/components/CardDialog.vue'
import FsLightbox from "fslightbox-vue/v3";
import Dropzone from 'dropzone';
import 'dropzone/dist/dropzone.css';
const SERVER_URL = import.meta.env.VITE_SERVER_URL


const acceptedFiles = ['jpg', 'jpeg', 'png', 'zip']

const sources = ref([])
const cardDialog = ref(false)
const dz = ref(null)
const directories = ref([])


const lightBoxToggler = ref(false)
const isLightBoxOpen = ref(false)
const lightBoxSources = ref([])
const slide = ref(0)

onMounted(() => {
    getDirectories()
    dz.value = new Dropzone("div#dropZone", {
        url: `${SERVER_URL}upload`,
        method: "post",
        acceptedFiles: "image/*,.zip",
        parallelUploads: 1,
        maxFilesize: 200000,
        parallelChunkUploads: true,
        chunkSize: 100000,
        retryChunks: true,
        retryChunksLimit: 3,
        chunking: true,
        forceChunking: true,
        autoProcessQueue: true,
        chunksUploaded: async function (file, done) {
            let currentFile = file
            console.log("all chunks have been uploaded", currentFile);
            // merge chunks
            done()

            await catChunks(currentFile)
            await extractAndSort(currentFile)
            getDirectories()
        },
        params: function (files, xhr, chunk) {
            if (chunk) {
                return {
                    dzUuid: chunk.file.upload.uuid,
                    dzChunkIndex: chunk.index,
                    dzTotalFileSize: chunk.file.size,
                    dzCurrentChunkSize: chunk.dataBlock.data.size,
                    dzTotalChunkCount: chunk.file.upload.totalChunkCount,
                    dzChunkByteOffset: chunk.index * this.options.chunkSize,
                    dzChunkSize: this.options.chunkSize,
                    dzFilename: chunk.file.name,
                }
            }
        }
    });


    dz.value.on("error", (error, file) => {
        console.error(file)
    })

    dz.value.on("addedfile", file => {
    });

    dz.value.on("sending", file => {

    })

    dz.value.on("complete", file => {
        dz.value.removeAllFiles()
    })


})

const catChunks = async (currentFile) => {

    return await fetch(`${SERVER_URL}cat-chunks/${currentFile.upload.uuid}/${currentFile.upload.totalChunkCount}/${currentFile.name.substr(currentFile.name.lastIndexOf('.') + 1)}/${currentFile.name}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

const extractAndSort = async (currentFile) => {
    await fetch(`${SERVER_URL}bryan-arrete-de-zipper/${currentFile.name}`).then(response => { console.log(response); })
}


const getDirectories = async () => {

    const response = await fetch(SERVER_URL + 'get-directories')
    if (response.ok) {
        const data = await response.json();
        directories.value = data.directories;

        console.log(directories.value);
    } else {
        console.error('Erreur lors de la récupération du contenu du fichier : ', response.statusText)
    }
}

const updateParameters = (params) => {
    sources.value = params
}

const clickedImage = (src, images, index) => {
    lightBoxSources.value = []
    lightBoxToggler.value = !lightBoxToggler.value
    lightBoxSources.value = images.map((image) => src + '/' + image)
    slide.value = index
}

const openCardDialog = (source) => {
    cardDialog.value.show(source)
}

const lightBoxClosed = (event) => {
    isLightBoxOpen.value = false
}

const lightBoxOpened = (event) => {
    isLightBoxOpen.value = true
}
</script>

<style scoped>
.images-options {
    height: 30vh;
}

.images-displayer {
    height: 65vh;
    overflow-y: scroll;
}
</style>