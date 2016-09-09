var app = angular.module('Proxy', []);

app.controller('ProxyController', function($scope) {

    $scope.go = function () {
        window.location.href = '/site/' + window.btoa($scope.url);
    };
});
