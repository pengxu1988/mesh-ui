module meshAdminUi {

    class LoginController {

        private success: boolean = false;
        private loggingIn: boolean = false;

        constructor( private $timeout: ng.ITimeoutService,
                     private $state: ng.ui.IStateService,
                     private $mdDialog: ng.material.IDialogService,
                     private authService: AuthService) {
        }

        public submitForm(event: Event, userName: string, password: string) {
            this.loggingIn = true;
            this.authService.logIn(userName, password)
                .then(() => {
                    this.success = true;
                    this.$timeout(() => this.$state.go('projectsList'), 1500);
                })
                .catch(() => {
                    this.showErrorDialog();
                    this.loggingIn = false;
                });
        }

        /**
         * Displays an error message on login failure.
         */
        private showErrorDialog() {
            return this.$mdDialog.show({
                templateUrl: 'login/loginErrorDialog.html',
                controller: function ($mdDialog) {
                    this.cancel = function () {
                        $mdDialog.cancel();
                    };
                },
                controllerAs: 'vm'
            });
        }
    }

    angular.module('meshAdminUi.login')
        .controller('LoginController', LoginController);

}