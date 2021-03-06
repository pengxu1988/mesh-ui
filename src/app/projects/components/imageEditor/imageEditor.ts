module meshAdminUi {

    export interface IImageTransformParams {
        src?: string;
        width?: number;
        height?: number;
        cropRect?: {
            width: number;
            height: number;
            startX: number;
            startY: number;
        };
        scale?: number;
        language?: string;
        version?: string;
    }

    class ImageEditorController {

        public transformParams: IImageTransformParams = {};
        // used to hide the contents which the cropper is initializing to
        // prevent some layout thrashing.
        public loaded: boolean = false;
        public selectedTab: string = 'crop';

        constructor(private $mdDialog: ng.material.IDialogService,
                    private $scope: ng.IScope,
                    $timeout: ng.ITimeoutService,
                    private src: string,
                    private initialTransform: IImageTransformParams) {

            const defaultParams:IImageTransformParams = {
                src: this.src,
                width: 0,
                height: 0,
                cropRect: {
                    height: 0,
                    width: 0,
                    startX: 0,
                    startY: 0
                },
                scale: 1
            };

            // if any transform params have been passed in via initialTransform, use them instead
            // of the default value.
            for (let key in defaultParams) {
                this.transformParams[key] = this.initialTransform[key] || defaultParams[key];
            }
            // ensure we always use an up-to-date source string.
            this.transformParams.src = src;

            $timeout(() => this.loaded = true, 500);
        }

        /**
         * Update the transform parameters. Should be invoked from one of the imageEditor "plugins" as a
         * callback when that plugin makes some alteration to the params. The newParams argument need not be a
         * complete IImageTransformParams object - it can specify only a new scale, for example, and only
         * that property will get updated.
         */
        private updateTransformParams(newParams: IImageTransformParams) {
            for (let param in newParams) {
                if (newParams.hasOwnProperty(param) && this.transformParams.hasOwnProperty(param)) {
                    this.transformParams[param] = newParams[param];
                }
            }
        }

        /**
         * The "reCalcViewDimensions" event is required by the rzSlider directive to
         * ensure the resize slider has the correct width. Since the slider is being created inside some dynamic DOM,
         * it is initially sized incorrectly. Therefore we need to manually trigger this event in order to force a
         * recalculation of its dimensions.
         */
        public resizeTabSelected() {
            this.$scope.$broadcast('reCalcViewDimensions');
            this.selectedTab = 'resize';
        }

        /**
         * Close the modal and return the transform params.
         */
        public save() {
            this.$mdDialog.hide(this.transformParams);
        }

        /**
         * Cancel the modal and return nothing.
         */
        public cancel() {
            this.$mdDialog.cancel();
        }
    }

    /**
     * This controller is responsible for creating and opening the modal window which
     * contains the image editor component.
     */
    class EditableImageController {
        private src: string;
        private offsetRight: number = -500;
        private onEdit: Function;
        private initialTransform: IImageTransformParams;

        constructor($timeout: ng.ITimeoutService,
                    $scope: ng.IScope,
                    $element: JQuery,
                    private $mdDialog: ng.material.IDialogService) {
            
            // since the edit image button has varying width depending on the 
            // length of the word "edit" in different languages, we need to set 
            // the right offset dynamically.
            let unwatch = $scope.$watch(() => this.src, (val) => {
                if (val) {
                    $timeout(() => {
                        let el = <HTMLElement>$element[0].querySelector('.edit-image-button');
                        let iconWidth = 35;
                        this.offsetRight = iconWidth - el.offsetWidth;
                    });
                    unwatch();
                }
            });
        }

        public editImage(): ng.IPromise<void> {
            return this.$mdDialog.show({
                    templateUrl: 'projects/components/imageEditor/imageEditor.html',
                    controller: 'ImageEditorController',
                    controllerAs: 'vm',
                    locals: {
                        src: this.src,
                        initialTransform: this.initialTransform,
                    },
                    bindToController: true
                })
                .then((result: IImageTransformParams) => {
                    this.onEdit({ transform: result })
                });
        }
    }

    /**
     * Creates an overlay button which adds a link to open the image editor modal.
     *
     * Accepts the following attributes:
     * src: The source URL of the image to be edited.
     * initialTransform: The initial transform to apply to the image.
     * onEdit: A function that will be invoked with a `transform` argument when an image is edited.
     */
    function editableImageDirective() {
        return {
            restrict: 'E',
            template: `<div class="editable-image-container">
                            <div class="edit-image-button" 
                                ng-style="{ right: vm.offsetRight + 'px' }"
                                ng-click="vm.editImage()" 
                                ng-if="vm.src !== ''">
                                <i class="icon-crop"></i> <span translate>EDIT</span>
                            </div>
                            <ng-transclude></ng-transclude>
                       </div>`,
            controller: 'EditableImageController',
            controllerAs: 'vm',
            bindToController: true,
            transclude: true,
            scope: {
                src: '=',
                initialTransform: '=',
                onEdit: '&'
            }
        }
    }

    angular.module('meshAdminUi.projects.imageEditor', ['rzModule'])
        .directive('editableImage', editableImageDirective)
        .controller('EditableImageController', EditableImageController)
        .controller('ImageEditorController', ImageEditorController);
}
