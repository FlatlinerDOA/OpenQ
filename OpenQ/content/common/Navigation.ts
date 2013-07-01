/// <reference path="../../types/client.d.ts" />
module Navigation {
    export var currentTemplate;
    export var currentViewModel;

    export function show(viewModel, template: string = null) {
        this.currentTemplate('');
        this.currentViewModel(viewModel);
        this.currentTemplate(template || viewModel.template);
    }
}
