angular.module("kitware.SimPut.core")
    .directive('simputInputPropertyPanel', ['$compile', function ($compile) {

        return {
            restrict: 'AE',
            scope: {
                data: '=',
                property: '=',
                viewModel: '=',
                template: '='
            },
            controller: ['$scope', function($scope) {
                $scope.toggleLocalHelp = function(id) {
                    var domElem = document.getElementsByClassName('help-' + id)[0],
                        display = domElem ? domElem.style.display : null;

                    if(domElem) {
                        if(display === 'none') {
                            domElem.style.display = '';
                        } else {
                            domElem.style.display = 'none';
                        }
                    }
                };
            }],
            link: function(scope, element, attrs) {
                var htmlCode = null,
                    templateKey = scope.property.type + '-' + scope.property.size,
                    template = scope.template,
                    data = scope.data;

                if(data === undefined) {
                    // No data available yet
                    console.log('No data available yet');
                    console.log(scope);
                    return;
                }

                if(scope.property.layout) {
                    templateKey += '-' + (scope.property.layout);
                }
                
                if(templatizer.simput.core.tpls.properties[templateKey]) {
                    // Add data for property
                    if(scope.data[scope.property.id] === undefined) {
                        scope.data[scope.property.id] = template.extractDefault(scope.property, scope.viewModel);
                    }

                    htmlCode = templatizer.simput.core.tpls.properties[templateKey]();

                    // Add help
                    if(scope.template.help[scope.property.id]) {
                        htmlCode += '<md-card style="display:none;" class="help-content help-'+scope.property.id+'"><md-card-content>' + scope.template.help[scope.property.id] + '</md-card-content></md-card>';
                    } else {
                        console.log("missing help for: " + scope.property.id);
                    }
                    
                    element.replaceWith($compile(htmlCode)(scope));
                    if(scope.template.help[scope.property.id]) {
                        document.getElementsByClassName('help-' + scope.property.id)[0].display = 'none';
                    }
                } else {
                    element.replaceWith($compile(templatizer.simput.core.tpls.properties['error']())(scope));
                }
            }
        };
    }]);
