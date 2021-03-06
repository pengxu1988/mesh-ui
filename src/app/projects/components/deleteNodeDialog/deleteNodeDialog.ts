module meshAdminUi {

    export class DeleteNodeDialog {

        constructor(private $mdDialog: ng.material.IDialogService) {
        }

        public show(node: INode): ng.IPromise<string[]> {
            return this.$mdDialog.show({
                controller: 'ConfirmDeleteDialogController',
                controllerAs: 'vm',
                bindToController: true,
                templateUrl: 'projects/components/deleteNodeDialog/confirmDeleteDialog.html',
                locals: {
                    node: node
                }
            });
        }

        public showMulti(): ng.IPromise<{ deleteAllLangs: boolean }> {
            return this.$mdDialog.show({
                controller: 'ConfirmDeleteDialogController',
                controllerAs: 'vm',
                bindToController: true,
                templateUrl: 'projects/components/deleteNodeDialog/confirmDeleteDialogMulti.html',
                locals: {
                    node: false
                }
            });
        }

    }

    angular.module('meshAdminUi.projects')
        .service('deleteNodeDialog', DeleteNodeDialog);
}
