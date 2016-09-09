var app = angular.module('Proxy', []);

app.controller('ProxyController', function($scope) {

    $scope.go = function () {
        window.location.href = '/site/' + new Buffer($scope.url).toString('base64');
    };
});
