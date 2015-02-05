angular.module("kitware.SimPut.core")
    .controller('SimPut.InputController', ['$rootScope', '$scope', '$window', '$timeout', '$mdDialog', function ($rootScope, $scope, $window, $timeout, $mdDialog) {
        
        // From the directive we have in our scope viewModel and template
        $scope.activeSection = null;
        $scope.errors = [];

        $scope.removeView = function (viewId, index) {
            $scope.viewModel.data[viewId].splice(index,1);
            $scope.activateSection(null, 0);
        };

        $scope.addView = function (event, viewId) {
            var controllerScope = $scope,
                title = $scope.template.definition.views[viewId].label;

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', function($scope, $mdDialog) {

                    $scope.title = title;
                    $scope.namePlaceHolder = "Name for the new view";

                    $scope.ok = function(response) {
                        $mdDialog.hide(response);
                    };
                    $scope.cancel = function() {
                        $mdDialog.cancel();
                    };
                }],
                template: templatizer.simput.core.tpls['create-input-view-dialog'](),
                targetEvent: event,
            })
            .then(function(formData) {
                // Make sure we have room for given view
                if($scope.viewModel.data === undefined) {
                   $scope.viewModel.data = {};
                }
                if($scope.viewModel.data[viewId] === undefined) {
                   $scope.viewModel.data[viewId] = [];
                }

                // Activate view
                var viewModel = $scope.template.generateViewDataModel(viewId, controllerScope.viewModel.data[viewId].length, controllerScope.viewModel);
                viewModel.name = formData.name;
                controllerScope.viewModel.data[viewId].push(viewModel);
                controllerScope.activateSection(viewId, controllerScope.viewModel.data[viewId].length - 1);
            }, function() {
                // Nothing to do when close
            });
        };

        $scope.activateSection = function(viewId, index) {
            var viewSubDataModel = null;

            if(!viewId ) {
                $scope.activeSection = { view: null, idx: 0, data: {} };
                return;
            }
            if($scope.viewModel.data === undefined) {
                $scope.viewModel.data = {};
            }

            if($scope.viewModel.data[viewId] === undefined) {
                $scope.viewModel.data[viewId] = [];
            }

            // Check if view data already available
            if(index < $scope.viewModel.data[viewId].length) {
                viewSubDataModel = $scope.viewModel.data[viewId][index];
            } else {
                // Need to generate data from default
                viewSubDataModel = $scope.template.generateViewDataModel(viewId, $scope.viewModel.data[viewId] ? $scope.viewModel.data[viewId].length : 0, $scope.viewModel);
                $scope.viewModel.data[viewId].push(viewSubDataModel);
            }

            $scope.activeSection = { view: viewId, idx: index, data: viewSubDataModel };
        };

        $scope.saveDataModel = function () {
            $rootScope.$broadcast('simput-click', 'save-model');
            $rootScope.$broadcast('save-file', {
                name: $scope.template.files[0],
                content: JSON.stringify($scope.viewModel, null, 4)
            });
        };

        $scope.saveOutput = function () {
            $rootScope.$broadcast('simput-click', 'save-output');

            try {
                var jadeModel = $scope.template.extract($scope.template, $scope.viewModel),
                    outputContent = '';
    
                $scope.errors = jadeModel.errors;
    
                if(jadeModel.valid) {
                    try {
                        outputContent = $scope.template.template(jadeModel.data);
                        $rootScope.$broadcast('save-file', {
                            name: $scope.template.files[1],
                            content: outputContent
                        });
                    } catch(error) {
                        $scope.errors.push("Output generation failed when applying template.");
                        $scope.errors.push(error.message);
                        console.log(jadeModel);
                        $rootScope.$broadcast('simput-error');
                    }
                } else {
                    $rootScope.$broadcast('simput-error');
                }
            } catch(error) {
                console.log(error.message);
                $rootScope.$broadcast('simput-error');
            }
        }

        $scope.showErrors = function(event) {
            var errors = $scope.errors;
            $mdDialog.show({
                controller: ['$scope', '$mdDialog', function($scope, $mdDialog) {

                    $scope.quit = function() {
                        $mdDialog.cancel();
                    };
                    $scope.errors = errors;
                }],
                template: templatizer.simput.core.tpls['error-view-dialog'](),
                targetEvent: event,
            });
        };

    }]);
