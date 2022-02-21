const { src, dest, parallel, series, watch } = require('gulp');
const del = require('del');
const pug = require('gulp-pug');
const debug = require('gulp-debug');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const imagemin = require('gulp-imagemin');
const uglify = require('gulp-uglify-es').default;
const bs = require('browser-sync').create();


// очищаем папку build
function clean() {
    return del('build/');
}

// переводим pug в html
function pug2html() {
    //pug прогоняем в html 
    return src('src/pug/*.pug')
        .pipe(pug({
            pretty: true
        }))
        //с помощью debug выводим в консоль сообщение какие действия произошли и какие файлы были измененны
        .pipe(debug({
            title: 'pug to html',
            showCount: false
        }))
        //указываем путь куда выгружаем файлы
        .pipe(dest('build/'))
}

//обработка стилей 
function styles() {
    return src('src/sass/style.sass')
        //запускает работу препроцесора sass
        .pipe(sass({
            includePaths: [
                'node_modules' //возможность подключения дополнительных файлов стилей которые установятся через npm пакет (искать файлы стилей в этой папке)
            ]
        }).on('error', sass.logError)) //выводим ошибки
        .pipe(autoprefixer()) //для провстановки векторных префиксов
        .pipe(dest('build/css/'))
        .pipe(cleanCSS({ //сжатие css
            debug: true
        }, details => {
            console.log(`${details.name}: Original size: ${details.stats.originalSize} - Minifide size: ${details.stats.minifiedSize}`)
        }))
        .pipe(rename({
            suffix: '.min'//добавляем к названию .min
        }))
        .pipe(dest('build/css'))//сохраняем файл в папку build/css
}

//обработка изображений
function images() {
    return src('src/images/*.{jpg,png,svg}')
        .pipe(imagemin())
        .pipe(dest('build/images/'));
}

//обработка js 
function js() {
    return src('src/js/main.js')
    .pipe(uglify())//минификатор js
    .pipe(dest('build/js/'))
}

//локальный сервер
function runServer(done) {
    bs.init({//инициализация сервера
        server: {
            baseDir: 'build',//место от куда сервер будет брать файлы
            index: 'index.html'
        },
        port: 8080,
        notify: false,
        logPrefix: 'Frontend_dev'
    })
    console.log('Сервер работает по адресу http://localhost:8080')
    done()
}

//перезагружаем сервер 
function reload(done) {
    bs.reload()
    done()
}

//собираем функционал
const build = series(
    clean,
    parallel(
        pug2html,
        styles,
        images,
        js
    )
)

// смотрит за измененьями
function watchFiles() {
    watch('src/pug/**/*.pug', series(pug2html, reload));
    watch('src/sass/*.sass', series(styles, reload));
    watch('src/images/*.{jpg,png,svg}', series(images, reload));
    watch('src/js/main.js', series(js, reload));
}

//собираем проект
exports.build = build;

// public tasks
exports.default = series(
    build,
    runServer,
    watchFiles
);

