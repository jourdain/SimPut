angular.module("kitware.SimPut.core")
    .directive('simputInputContentPanel', function () {
        return {
            restrict: 'AE',
            scope: {
                viewId: '@',
                viewIndex: '@',
                viewData: '=',
                viewModel: '=',
                template: '='
            },
            controller: ['$scope', function($scope) {
                $scope.isArray = SimPut.isArray;

                $scope.toggleHelp = function ($event) {
                    var list = $event.target.parentElement.parentElement.getElementsByClassName('help-content'),
                        count = list.length,
                        show = count > 0 ? (list[0].style.display === 'none') : false;

                    while(count--){
                        list[count].style.display = show ? '' : 'none';
                    }
                };
            }],
            template: templatizer.simput.core.tpls["simput-input-content"]()
        };
    });
