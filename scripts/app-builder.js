var fs = require('fs'),
    path = require('path'),
    arguments = require('minimist')(process.argv.slice(2)),
    inputHTML = arguments.i,
    outputApp = arguments.o,
    basePath = path.dirname(inputHTML);

// Helper

function extractAttributeValue(attributeName, line) {
    var rawAttrValue = line.split(attributeName + '=')[1];

    return rawAttrValue.split(rawAttrValue[0])[1];
}

// =======================
// Read input HTML
// =======================

var htmlContentLines = fs.readFileSync(inputHTML, encoding='utf8').split('\n'),
    outputBuffer = [], 
    line = null,
    lineNb = htmlContentLines.length;

for(var lineIdx = 0; lineIdx < lineNb; ++lineIdx) {
    line = htmlContentLines[lineIdx];

    // Search for script tag
    if(line.indexOf('<script ') !== -1 && line.indexOf('</script>') !== -1) {
        var fileToLoad = path.normalize(path.join(basePath, extractAttributeValue('src', line)));

        // console.log('Found script line: ' + fileToLoad);

        outputBuffer.push("<script>");
        outputBuffer.push(fs.readFileSync(fileToLoad, encoding='utf8'));
        outputBuffer.push("</script>");
    } else if(line.indexOf('<link ') !== -1 && line.indexOf('stylesheet') !== -1) {
        var fileToLoad = path.normalize(path.join(basePath, extractAttributeValue('href', line)));

        // console.log('Found CSS line: ' + fileToLoad);

        outputBuffer.push("<style>");
        outputBuffer.push(fs.readFileSync(fileToLoad, encoding='utf8').replace(/..\/fonts\//g, ''));
        outputBuffer.push("</style>");
    } else {
        outputBuffer.push(line);
    }
}

// Write output file
fs.writeFile(outputApp, outputBuffer.join('\n'));
