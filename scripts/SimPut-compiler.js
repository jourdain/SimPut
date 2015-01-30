var fs = require('fs'),
    path = require('path'),
    UglifyJS = require('uglify-js'),
    jade = require('jade'),
    arguments = require('minimist')(process.argv.slice(2)),
    workPath = arguments.p,
    name = arguments.n,
    outputFilePath = arguments.o,
    definitionFilePath = null,
    jadeFilePath = null,
    functionFilePath = null;

// =======================
// Extract arguments
// =======================

if(!workPath || !outputFilePath) {
    console.log("Usage: node SimPut-compiler.js -p PathToProcess -o FileToGenerate.js");
}

var outputJSTemplate = "(function(){" 
                         + "var module = { files: ['DATA', 'OUT'], help: {} }, jade = (function(){var exports={}; JADE_RUNTIME return exports;})();"
                         + "CONTENT"
                         + 'SimPut.registerTemplateLibrary("' + name + '", module);'
                         + "})();",
    contentBuffer = [];

function fillHelp(directory) {
    var files = fs.readdirSync(directory),
        count = files.length,
        buffer = [];

    while(count--) {
        if(files[count][0] !== '.') {
            buffer.push('module.help["' + files[count] + '"] = "');
            buffer.push(fs.readFileSync(path.join(directory, files[count]), encoding='utf8').replace(/"/g, '\\\"').replace(/\n/g, '\\n'));
            buffer.push('";');
        }
    }
    return buffer.join('');
}

function extractFileTypes(pathToList) {
    var fileList = fs.readdirSync(pathToList),
        count = fileList.length,
        result = {};

    while(count--) {
        if(fileList[count].indexOf('.json') !== -1) {
            result.json = path.join(workPath, fileList[count]);
        } else if(fileList[count].indexOf('.jade') !== -1) {
            result.jade = path.join(workPath, fileList[count]);
        } else if(fileList[count].indexOf('.js') !== -1) {
            result.js = path.join(workPath, fileList[count]);
        }
    }

    return result;
}

function extractConvertFunction(filePath) {
    var buffer = [];
    buffer.push("module.extract = ");
    buffer.push(fs.readFileSync(filePath, encoding='utf8'));
    buffer.push(";");
    return buffer.join('');
}

function extractJadeFunction(jadeFilePath) {
    var buffer = [],
        template = jade.compileClient(fs.readFileSync(jadeFilePath, 'utf-8'), {
            client: true,
            compileDebug: false,
            pretty: false
        }).toString();


    buffer.push("module.template = ");
    buffer.push(template);
    buffer.push(";");

    return buffer.join('');
}

function extractDefinitions(defFilePath) {
    var buffer = [],
        jsonObj = fs.readFileSync(defFilePath, 'utf-8');


    buffer.push("module.definition = ");
    buffer.push(jsonObj);
    buffer.push(";");

    return buffer.join('');
}

// Add Help
contentBuffer.push(fillHelp(path.join(workPath, 'help')));

// Extract files
var fileTypes = extractFileTypes(workPath);

// Handle JavaScript function
contentBuffer.push(extractConvertFunction(fileTypes.js));

// Handle Jade
contentBuffer.push(extractJadeFunction(fileTypes.jade));

// Handle Definition model
contentBuffer.push(extractDefinitions(fileTypes.json));

// Update content
outputJSTemplate = outputJSTemplate.replace(/DATA/g, arguments.d);
outputJSTemplate = outputJSTemplate.replace(/OUT/g, arguments.t);
outputJSTemplate = outputJSTemplate.replace(/CONTENT/g, contentBuffer.join(''));

// Update Jade runtime
outputJSTemplate = outputJSTemplate.replace(/JADE_RUNTIME/g, fs.readFileSync(path.join('node_modules', 'jade', 'lib', 'runtime.js'), 'utf-8'));

// Write output file
fs.writeFile(outputFilePath, UglifyJS.minify(outputJSTemplate, {fromString: true}).code);
