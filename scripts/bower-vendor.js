var mainBowerFiles = require("main-bower-files"),
    concat = require('concat'),
    fs = require('fs'),
    saveLicense = require('uglify-save-license'),
    uglifyJS = require('uglify-js'),
    cssmin = require('cssmin'),

    jsFiles = mainBowerFiles("**/*.js"),
    cssFiles = mainBowerFiles("**/*.css"),
    fontFiles = mainBowerFiles("**/*.{eot,svg,ttf,woff}");

// Handle JS
concat(jsFiles, 'dist/js/vendors.js', function(error) { 
    var minified = uglifyJS.minify('dist/js/vendors.js', {
            output: {
                comments: saveLicense
            },
            outSourceMap: "vendors-min.js.map"
        });
    fs.writeFile('dist/js/vendors-min.js', minified.code);
    fs.writeFile('dist/js/vendors-min.js.map', minified.map);
});

// Handle CSS
concat(cssFiles, 'dist/css/vendors.css', function(error) { 
    var css = fs.readFileSync("dist/css/vendors.css", encoding='utf8');
    fs.writeFile('dist/css/vendors-min.css', cssmin(css));
});

// Copy fonts
var count = fontFiles.length;
while(count--) {
    var srcPath = fontFiles[count],
        fileName = srcPath.split('/').pop();
    fs.createReadStream(srcPath).pipe(fs.createWriteStream("dist/fonts/" + fileName));
}
