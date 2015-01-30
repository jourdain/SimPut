function(definitions, model) {
    var resultModel = { valid: true, data: {}, errors: [] };

    // Internal attribute extractor functions ---------------------------------

    function extractDoubleArgs(viewInstance, exportObject) {
        exportObject.d1  = viewInstance['double-args'].d1;
        exportObject.d2  = viewInstance['double-args'].d2;
        exportObject.d3  = viewInstance['double-args'].d3;
        exportObject.d6  = viewInstance['double-args'].d6;
    }

    function extractStringArgs(viewInstance, exportObject) {
        exportObject.s1  = viewInstance['string-args'].s1;
        exportObject.s2  = viewInstance['string-args'].s2;
        exportObject.s3  = viewInstance['string-args'].s3;
    }

    function extractEnumArgs(viewInstance, exportObject) {
        exportObject.e1  = definitions.extractEnumValues('enum-args', 'enum-1', viewInstance, model.external);
        exportObject.en  = definitions.extractEnumValues('enum-args', 'enum-n', viewInstance, model.external);
    }

    function extractExtEnumArgs(viewInstance, exportObject) {
        exportObject.xe1  = definitions.extractEnumValues('ext-enum', 'enum-1', viewInstance, model.external);
        exportObject.xen  = definitions.extractEnumValues('ext-enum', 'enum-n', viewInstance, model.external);
    }

    // Handle view "all" ------------------------------------------------------
    try {
        var section1 = resultModel.data.a = { nestA: [], nestB: [] },
            viewInstance = model.data.all[0];

        extractDoubleArgs  (viewInstance, section1);
        extractStringArgs  (viewInstance, section1);
        extractEnumArgs    (viewInstance, section1);
        extractExtEnumArgs (viewInstance, section1);
    } catch (er) {
        resultModel.valid = false;
        resultModel.errors.push("Unable to process all the data from Section 1");
        resultModel.errors.push(er.message);
    }

    // Handle view "nested" ----------------------------------------------------
    try {
        var count = model.data['nested-a'].length;
        while(count--) {
            var viewInstance = model.data['nested-a'][count],
                exportData = { name: viewInstance.name };

            extractDoubleArgs  (viewInstance, exportData);
            extractStringArgs  (viewInstance, exportData);
            extractEnumArgs    (viewInstance, exportData);
            extractExtEnumArgs (viewInstance, exportData);

            section1.nestA.push(exportData);
        }

    } catch (er) {
        resultModel.valid = false;
        resultModel.errors.push("Error in Section 1: Nested A => " + er.message);
    }
    
    try {
        var count = model.data['nested-b'].length;
        while(count--) {
            var viewInstance = model.data['nested-b'][count],
                exportData = { name: viewInstance.name };

            extractDoubleArgs  (viewInstance, exportData);
            extractStringArgs  (viewInstance, exportData);
            extractEnumArgs    (viewInstance, exportData);
            extractExtEnumArgs (viewInstance, exportData);

            section1.nestB.push(exportData);
        }

    } catch (er) {
        resultModel.valid = false;
        resultModel.errors.push("Error in Section 1: Nested B => " + er.message);
    }
    

    // Handle view "multi" ----------------------------------------------------
    
    try {
        var section2 = resultModel.data.b = [],
            count = model.data.multi.length;
        while(count--) {
            var viewInstance = model.data.multi[count];
    
            section2.push({
                "name" : viewInstance.name,
                "d1"   : viewInstance['double-args'].d1,
                "d2"   : viewInstance['double-args'].d2,
                "d3"   : viewInstance['double-args'].d3,
                "d6"   : viewInstance['double-args'].d6
            });
        }
    } catch (er) {
        resultModel.valid = false;
        resultModel.errors.push("Error in Section 2: " + er);
    }

    // Handle view "choice" ---------------------------------------------------

    try {
        var section3 = resultModel.data.c = {},
            viewInstance = model.data.choice[0],
            orSelector = definitions.extractOrSelection(viewInstance),
            exportMap = {
                "double-args" : extractDoubleArgs,
                "string-args" : extractStringArgs, 
                "enum-args"   : extractEnumArgs,
                "ext-enum"    : extractExtEnumArgs
            };

        extractStringArgs(viewInstance, section3);
        extractDoubleArgs(viewInstance, section3);

        exportMap[orSelector[0]](viewInstance, section3);
    } catch (er) {
        resultModel.valid = false;
        resultModel.errors.push("Error in Section 3: " + er);
    }

    // ------------------------------------------------------------------------

    return resultModel;
}
