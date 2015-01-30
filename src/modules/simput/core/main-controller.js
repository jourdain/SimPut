angular.module("kitware.SimPut.core")
    .controller('SimPut.MainController', ['$scope', '$window', '$timeout',  function ($scope, $window, $timeout) {
        var SimPut = $window.SimPut;

        $scope.title = "SimPut";
        $scope.viewModel = null;
        $scope.template = null;

        $scope.updateDataModel = function (data) {
            $scope.template = data.type ? SimPut.getTemplate(data.type) : null;
            $scope.viewModel = data;
            $scope.$apply();
        };
    }]);
