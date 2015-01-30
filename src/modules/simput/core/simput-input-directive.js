angular.module("kitware.SimPut.core")
    .directive('simputInputPanel', function () {

        return {
            restrict: 'AE',
            scope: {
                viewModel: '=',
                template: '='
            },
            controller: 'SimPut.InputController',
            template: templatizer.simput.core.tpls["simput-input"]()
        };
    });
