const path = {
  build: {
    html: 'build/html/',
    js: 'build/js/',
    css: 'build/css/',
    images: 'build/images/',
    img: 'build/img/',
    fonts: 'build/fonts/',
  },
  src: {
    pug: 'source/templates/*.pug',
    pugDir: 'source/templates',
    js: 'source/js/index.js',
    styleDir: 'source/styles/',
    styleLibsDir: 'source/styles/libs/',
    style: 'source/styles/style.scss',
    images: 'source/images/**/*.{png,jpg,svg}',
    img: 'source/img/**/*.{png,jpg,svg}',
    fonts: 'source/fonts/**/*.woff',
    icons: 'source/images/**/icon-*.svg',
    data: 'data/data.json',
  },
  watch: {
    js: 'source/js/**/*.js',
    style: 'source/styles/**/*.scss',
    pug: 'source/templates/**/*.pug',
    images: 'source/images/**/*.*',
    fonts: 'source/fonts/**/*.*',
    data: 'data/data.json',
  },
  clean: '/build/',
};

import { src, dest, watch, series, parallel, task } from 'gulp';

import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import rename from 'gulp-rename';
import autoprefixer from 'gulp-autoprefixer';
import del from 'del';
import imagemin from 'gulp-imagemin';
import svgo from 'imagemin-svgo';
import jpegtran from 'imagemin-jpegtran';
import plumber from 'gulp-plumber';
import sourcemap from 'gulp-sourcemaps';
import pug from 'gulp-pug';
import util from 'gulp-util';
import gulpIf from 'gulp-if';
import browsersync from 'browser-sync';
import data from 'gulp-data';
import fs from 'fs';
import posthtml from 'gulp-posthtml';
import include from 'posthtml-include';
import svgstore from 'gulp-svgstore';

const server = browsersync.create();
const sass = gulpSass(dartSass);
const production = !!util.env.production;

task('browserSync', () => {
  return server.init({
    server: 'build/',
    notify: false,
    cors: true,
    ui: false,
    port: 1378,
  });
});

task('refresh', (done) => {
  server.reload();
  done();
});

task('styles', () => {
  return src(path.src.style)
    .pipe(plumber())
    .pipe(gulpIf(!production, sourcemap.init()))
    .pipe(sass(gulpIf(production, { outputStyle: 'compressed' })))
    .pipe(autoprefixer())
    .pipe(rename('style.min.css'))
    .pipe(gulpIf(!production, sourcemap.write('.')))
    .pipe(dest('build'));
});

task('images', () => {
  return src(path.src.images, path.src.img)
    .pipe(
      imagemin([
        imagemin.optipng({ optimizationLevel: 2 }),
        jpegtran({ progressive: true }),
        svgo(),
      ]),
    )
    .pipe(dest(path.build.img));
});

task('sprite', () => {
  return src(path.src.icons)
    .pipe(
      svgstore({
        inlineSvg: true,
      }),
    )
    .pipe(rename('sprite.svg'))
    .pipe(dest('source/images/icons'));
});

task('html', () => {
  return src(path.src.pug)
    .pipe(
      data(function () {
        return JSON.parse(fs.readFileSync(path.src.data));
      }),
    )
    .pipe(
      pug({
        pretty: true,
      }),
    )
    .pipe(posthtml([include()]))
    .pipe(dest('build'));
});

task('copy', () => {
  return src([path.src.img, path.src.images, path.src.fonts], {
    base: 'source',
  }).pipe(dest('build'));
});

task('clean', () => {
  return del('build');
});

task('watching', () => {
  watch(path.watch.style, { delay: 1000 }, series('styles', 'refresh'));
  watch(path.watch.js, { delay: 1000 }, series('refresh'));
  watch(
    [path.watch.pug, path.src.data],
    { delay: 1000 },
    series('html', 'refresh'),
  );
});

task('build', series('clean', 'styles', 'sprite', 'copy', 'html'));
task('start', series('build', parallel('browserSync', 'watching')));
