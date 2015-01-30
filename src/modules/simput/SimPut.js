(function(window){
    var module = {},
        templateModules = {},
        templateList = [];

    // ----------------------------------------------------------------------
    // Init SimPut module if needed
    // ----------------------------------------------------------------------
    if (window.hasOwnProperty("SimPut")) {
        module = window.SimPut || {};
    } else {
        window.SimPut = module;
    }

    // ----------------------------------------------------------------------
    // Internal methods
    // ----------------------------------------------------------------------

    function getTemplate(name) {
        return templateModules[name];
    }

    // ----------------------------------------------------------------------

    function isArray(obj) {
        return Array.isArray(obj);
    }

    // ----------------------------------------------------------------------

    function findParamaterById ( parameterList, id ) {
        var count = parameterList.length;
        while(count--) {
            if(parameterList[count].id === id) {
                return parameterList[count];
            }
        }
        return null;
    } 

    // ----------------------------------------------------------------------

    function extractOrSelection(viewInstance) {
        var templateObject = this,
            attributeDef = templateObject.definition.definitions,
            attrMap = {},
            result = [];

        // Create reverse map
        for(var key in attributeDef) {
            attrMap[attributeDef[key].label] = key;
        }

        // Fill result attribute name while skipping non OR views
        for(var idx = 0; idx < viewInstance.or.length; ++idx) {
            if(viewInstance.or[idx].active) {
                result.push(attrMap[viewInstance.or[idx].active]);
            }
        }

        return result;
    }

    // ----------------------------------------------------------------------

    function extractEnumValues(attributeName, parameterId, viewInstance, externalData) {
        var templateObject = this,
            activeLabels = viewInstance[attributeName][parameterId],
            parameter = findParamaterById(templateObject.definition.definitions[attributeName].parameters, parameterId),
            enumData = parameter.enum.external ? externalData[parameter.enum.external] : parameter.enum;

        if(isArray(activeLabels)) {
            // Multi-select
            var result = [], 
                count = activeLabels.length;

            while(count--) {
                var idx = enumData.labels.indexOf(activeLabels[count]);
                if(idx !== -1) {
                   result.push(enumData.values[idx]); 
                } else {
                    console.log("Could not find " + activeLabels[count].toString() + " inside " + enumData.labels.toString());
                }
            }
            return result;
        } else {
            // Single value
            var idx = enumData.labels.indexOf(activeLabels);
            if(idx !== -1) {
               return enumData.values[idx]; 
            } else {
                console.log("Could not find " + activeLabels + " inside " + enumData.labels.toString());
            }
        }

        return null;
    } 

    // ----------------------------------------------------------------------

    function extractDefault(parameter, viewModel) {
        var templateObject = this,
            value = parameter.default,
            size = Number(parameter.size),
            type = parameter.type;

        if(type === 'enum') {
            var enumValues = parameter.enum.external ? viewModel.external[parameter.enum.external].labels : parameter.enum.labels;
            if(enumValues === undefined) {
                console.log("No enum value for " + parameter.id);
                console.log(parameter);
            }
            if(isArray(value)) {
                var result = [];
                for(var idx = 0; idx < value.length; ++idx) {
                    result.push(enumValues[value[idx]]);
                }
                return result;
            } else if(value >= 0 && value < enumValues.length){
                return enumValues[value];
            }
        }

        return value;
    }

    // ----------------------------------------------------------------------

    function generateAttributeData(definitions, attributeName, viewModel) {
        var templateObject = this,
            params = definitions[attributeName].parameters,
            pCount = params ? params.length : 0,
            data = {};

        // Feel current data object
        while(pCount--) {
            data[params[pCount].id] = this.extractDefault(params[pCount], viewModel);
        }

        return data;
    }

    // ----------------------------------------------------------------------

    function generateViewDataModel(viewId, viewIndex, viewModel) {
        var templateObject = this,
            definitions = templateObject.definition.definitions,
            attributes = templateObject.definition.views[viewId].attributes,
            viewNames = templateObject.definition.views[viewId].names,
            count = attributes.length,
            viewData = { name: "New view", or: []};

        if(viewNames && viewIndex < viewNames.length) {
            viewData.name = viewNames[viewIndex];
        }

        // Process each attributes
       while(count--) {
            // Fill or list
            viewData.or.push({});

            if(isArray(attributes[count])) {
                // We are in the OR case
                var attrList = attributes[count],
                    orItem = { active: "", labels: [], values:[], collapsed: false };

                // Add attributes
                for(var idx = 0; idx < attrList.length; ++idx) {
                    viewData[attrList[idx]] = templateObject.generateAttributeData(definitions, attrList[idx], viewModel);
                    orItem.labels.push(definitions[attrList[idx]].label );
                    orItem.values.push(attrList[idx]);
                }
                orItem.active = orItem.labels[0];

                // Register our OR data model
                viewData.or.pop();
                viewData.or.push(orItem);
            } else {
                // Regular attribute
                if(!definitions[attributes[count]].parameters) {
                    console.log("No parameters for " + attributes[count]);
                    continue;
                }

                // Keep data inside viewModel
                viewData[attributes[count]] = templateObject.generateAttributeData(definitions, attributes[count], viewModel);
            }
        }
        viewData.or.reverse();

        return viewData;
    }

    // ----------------------------------------------------------------------

    function registerTemplateLibrary(name, templateLib) {
        templateList.push(name);
        templateModules[name] = templateLib;

        // Extend library with helper functions
        templateLib.generateViewDataModel = generateViewDataModel;
        templateLib.generateAttributeData = generateAttributeData;
        templateLib.extractDefault        = extractDefault;
        templateLib.extractEnumValues     = extractEnumValues;
        templateLib.extractOrSelection    = extractOrSelection;
    }



    // ----------------------------------------------------------------------
    // Expose API to module
    // ----------------------------------------------------------------------

    module.registerTemplateLibrary  = registerTemplateLibrary;
    module.templateList             = templateList;
    module.getTemplate              = getTemplate;
    module.isArray                  = isArray;


})(window);
