/// <reference path="../../types/client.d.ts" />
/// <reference path="../common/Lib.ts" />
/// <reference path="SignupFormViewModel.ts"/>
var HomeViewModel = (function () {
    function HomeViewModel() {
        this.title = 'Welcome to OpenQ';
        this.template = 'HomeView';
    }
    HomeViewModel.prototype.signup = function () {
        var form = new SignupFormViewModel();
        Navigation.show(form);
    };

    HomeViewModel.prototype.login = function () {
    };
    return HomeViewModel;
})();
//# sourceMappingURL=HomeViewModel.js.map
