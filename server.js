const express = require('express')
const fs = require('fs').promises
const fs2 = require('fs')
const path = require('path')
const { promisify } = require('util')
const multer = require('multer')
const unzipper = require('unzipper')
const decompress = require("decompress");
const cors = require('cors')
require('dotenv').config()

const readFileAsync = (fs.readFile)
const writeFileAsync = (fs.writeFile)
const unlinkAsync = (fs.unlink)

const app = express()
const PORT = process.env.PORT || 3000
const PARENT_DIR = process.env.PARENT_DIR
const UPLOAD_DIR = process.env.UPLOAD_DIR

app.use(express.static(PARENT_DIR))
app.use(express.static(UPLOAD_DIR))

app.use(express.json());
app.use(cors({ 
    origin: /^http:\/\/localhost:3000\/?.*$/ 
}));

const storage = multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        const fileName = `${req.body.dzUuid}-${parseInt(req.body.dzChunkIndex) + 1}${ext}`
        cb(null, fileName)
    }
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('missing files')
        }

        if (!fs2.existsSync(UPLOAD_DIR)) {
            return res.status(500).send('missing upload dir')
        }

        // if (!fs2.accessSync(UPLOAD_DIR, fs2.constants.W_OK)) {
        //     return res.status(500).send(`not_writable:${UPLOAD_DIR}`)
        // }

        return res.status(200).json(req.file);
    } catch (error) {
        console.error(error);
        return res.status(500).send('rror file upload')
    }
});

app.get('/bryan-arrete-de-zipper/:fileName', async(req, res) => {
    const { fileName } = req.params;

    const zipFilePath = path.join(UPLOAD_DIR, fileName)

    try {
        const zipFileStats = await fs.stat(zipFilePath);
        if (!zipFileStats.isFile()) {
            return res.status(404).send('zip file does not exist');
        }

        // const readStream = fs2.createReadStream(zipFilePath);

        // readStream.pipe(unzipper.Extract({ path: PARENT_DIR }))
        //     .on('error', (err) => {
        //         console.error('unzip error :', err);
        //         res.status(500).send('unzip error.');
        //     })
        //     .on('finish', async () => {
        //         console.log('upzip success');

        //         await createDirectoryStructure(UPLOAD_DIR);

        //         res.status(200).send('unzipp success');
        //     });

        decompress(zipFilePath, PARENT_DIR)
            .then(async(files) => {
                //VOIR TODO func
                // await createDirectoryStructure(zipFilePath.replace('.zip', ''));
                res.status(200).send('unzipp success');
            }).catch((error) => {
                console.log(error);
              })

    } catch (err) {
        console.error('unzipp error :', err);
        res.status(500).send('unzip error');
    }
})

// TODO: a revoir
// async function createDirectoryStructure(directory) {
//     const files = await fs.readdir(directory);
    
//     for (const file of files) {
//         const filePath = path.join(directory, file);
//         const fileStats = await fs.stat(filePath);

//         if (fileStats.isDirectory()) {
//             await createDirectoryStructure(filePath);
//         } else {
//             const relativePath = path.relative(UPLOAD_DIR, filePath);
//             const targetPath = path.join(UPLOAD_DIR, convertFileNameToDirectoryStructure(relativePath));

//             await fs.mkdir(path.dirname(targetPath), { recursive: true });
//             await fs.rename(filePath, targetPath);
//         }
//     }
// }

// function convertFileNameToDirectoryStructure(fileName) {
//     return fileName.replace(/\_/g, '/');
// }

app.post('/cat-chunks/:uuid/:totalChunkCount/:fileExtension/:fileName', async(req, res) => {
    const { uuid, totalChunkCount, fileExtension, fileName } = req.params;
    const finalFileName = fileName

    const filePath = path.join(UPLOAD_DIR, `${finalFileName}.${fileExtension}`)
    
    try {
        // if(fs2.existsSync(UPLOAD_DIR)) {
        //     return res.status(500).send("upload dir missing")
        // }

        for (let i = 1; i <= totalChunkCount; i++) {
            const chunkFilePath = path.join(UPLOAD_DIR, `${uuid}-${i}.${fileExtension}`)
            const chunk = await readFileAsync(chunkFilePath);

            if (!chunk || chunk.length === 0) {
                return res.status(400).send('uploading chunks error');
            }

            await writeFileAsync(filePath, chunk, { flag: 'a' });

            await unlinkAsync(chunkFilePath)
            if (fs2.existsSync(chunkFilePath)) {
                return res.status(500).send('deleted file error');
            }
        }

        fs2.renameSync(filePath, path.join(UPLOAD_DIR, finalFileName));

        return res.status(200).send('it\s all good');

    } catch (error) {
        console.error(error)
        return res.status(500).send('concat chunk error')
    }

});

app.get('/get-directories', async (req, res) => {
    try {
        const getDirectoriesRecursive = async (dirPath) => {
            const children = await fs.readdir(dirPath)
            const directories = []

            for (const child of children) {
                const childPath = path.join(dirPath, child)
                const stats = await fs.stat(childPath)

                if (stats.isDirectory()) {
                    const imgs = await getImagesInDirectory(childPath);


                    directories.push({
                        children: await getDirectoriesRecursive(childPath),
                        id: child,
                        label: child,
                        images: imgs.length ? imgs : []
                    });
                }
                
            }

            return directories;
        };

        const directories = await getDirectoriesRecursive(PARENT_DIR);
        
        res.send({ directories })
    } catch (error) {
        console.error("error get directories list :", error)
        res.status(500).send('server error')
    }
});

const getImagesInDirectory = async (dirPath) => {
    const children = await fs.readdir(dirPath);
    const images = [];

    for (const child of children) {
        const childPath = path.join(dirPath, child);
        const stats = await fs.stat(childPath);

        if (!stats.isDirectory() && isImageFile(child)) {
            images.push(child);
        }
    }

    return images;
};

const isImageFile = (fileName) => {
    return /\.(jpg|jpeg|png|gif)$/i.test(fileName);
};

app.get('get-images', async (req, res) => {
    try {
        
    } catch (error) {
        console.error("get images error : ", error)
        res.status(500).send('server error')
    }
})

app.listen(PORT, () => {
    console.log(`server started on port :  ${PORT}`)
});
