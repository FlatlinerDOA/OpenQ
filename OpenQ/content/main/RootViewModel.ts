/// <reference path="../../types/jquery.d.ts" />
/// <reference path="../../types/client.d.ts" />
/// <reference path="../common/Navigation.ts"/>
/// <reference path="HomeViewModel.ts"/>
var rootVm;
declare var infuser;
class RootViewModel {
    currentTemplate = ko.observable('IntroductionView');
    currentViewModel = ko.observable(null);
    templateName: () => string;
    constructor() {
        Navigation.currentTemplate = this.currentTemplate;
        Navigation.currentViewModel = this.currentViewModel;
        this.templateName = () => {
            return this.currentTemplate();
        }

        Navigation.show(new HomeViewModel());
    }
}


$().ready(() => {
    rootVm = new RootViewModel();
    ko.applyBindings(rootVm);
});
