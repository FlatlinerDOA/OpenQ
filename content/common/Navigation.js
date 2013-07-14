var Navigation;
(function (Navigation) {
    Navigation.currentTemplate;
    Navigation.currentViewModel;

    function show(viewModel, template) {
        if (typeof template === "undefined") { template = null; }
        this.currentTemplate('');
        this.currentViewModel(viewModel);
        this.currentTemplate(template || viewModel.template);
    }
    Navigation.show = show;
})(Navigation || (Navigation = {}));
