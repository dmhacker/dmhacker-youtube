var app = angular.module('Proxy', []);

app.controller('ProxyController', function($scope, $http) {

    $scope.go = function () {
        var b64url = window.btoa($scope.url);
        $http({
            method: 'GET',
            url: '/exists/'+b64url
        }).then(function (resp) {
            if (resp.data.exists) {
                window.location.href = '/site/' + b64url;
            }
            else {
                Materialize.toast('That site does not exist!', 4000);
            }
        }, function (resp) {
            Materialize.toast(resp.data.message || 'An error occurred during processing.', 4000);
        });
    };
});
