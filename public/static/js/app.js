var app = angular.module('Proxy', []);

app.controller('ProxyController', function($scope, $http) {
    $scope.loading = false;

    $scope.view = function () {
        $scope.loading = true;
        var id = $scope.yt;
        $http({
            method: 'GET',
            url: '/target/'+id
        }).then(function (resp) {
            if (resp.data.link) {
                window.location.href = resp.data.link;
            }
            else {
                Materialize.toast('That video does not exist!', 4000);
            }
            $scope.loading = false;
        }, function (resp) {
            Materialize.toast(resp.data.message || 'An error occurred during processing.', 4000);
            $scope.loading = false;
        });
    };
});
