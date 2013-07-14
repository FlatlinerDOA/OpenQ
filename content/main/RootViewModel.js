var rootVm;

var RootViewModel = (function () {
    function RootViewModel() {
        var _this = this;
        this.currentTemplate = ko.observable('IntroductionView');
        this.currentViewModel = ko.observable(null);
        Navigation.currentTemplate = this.currentTemplate;
        Navigation.currentViewModel = this.currentViewModel;
        this.templateName = function () {
            return _this.currentTemplate();
        };

        Navigation.show(new HomeViewModel());
    }
    return RootViewModel;
})();

$().ready(function () {
    rootVm = new RootViewModel();
    ko.applyBindings(rootVm);
});
