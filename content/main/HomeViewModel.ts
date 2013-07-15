/// <reference path="../../types/client.d.ts" />
/// <reference path="../common/Lib.ts" />
/// <reference path="SignupFormViewModel.ts"/>

class HomeViewModel implements IPageViewModel {
    title = 'Welcome to OpenQ';
    template = 'HomeView';
    constructor() {
    }

    signup() {
        var form = new SignupFormViewModel();
        Navigation.show(form);
    }

    login() {
    }
}