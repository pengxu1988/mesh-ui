module meshAdminUi {

    class DefaultControlController {

        public fieldModel: INodeFieldModel;
        public value: any;

        constructor($scope: ng.IScope) {
            $scope.$watch(() => this.fieldModel.value, val => {
                this.value = angular.copy(val);
            });
        }
    }

    function makeStandardDDO(type, controller?: string) {

        var controllerName = controller || 'DefaultControlController';
        return {
            restrict: 'E',
            templateUrl: `projects/components/formBuilder/standardControls/${type}Control.html`,
            controller: controllerName,
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                fieldModel: '='
            }
        };
    }

    /**
     * Input for string field types
     */
    function stringDirective() {
        return makeStandardDDO('string');
    }

    /**
     * Input for number field types
     */
    function numberDirective() {
        return makeStandardDDO('number');
    }

    declare var moment: moment.MomentStatic;


    /**
     * Since the input[type="date"] directive requires a Date object, we need to convert the
     * ISO8601 string into a Date object and bind to that.
     */
    class DateController {

        public fieldModel: INodeFieldModel;
        public value: Date;
        private valueMoment: moment.Moment;
        public focussed: string = '';
        public time = { h: null, m: null, s: null};

        constructor(private $scope: any, private $element: any) {
            // this flag prevents the update callback from firing as soon as the
            // control loads and performs a mutation of the value to a Date object.
            let initialDateConversionDone = false;

            if (this.fieldModel.value) {
                this.valueMoment = moment(this.fieldModel.value);
            } else {
                // if the value is not yet set, default it to the current timestamp
                this.valueMoment = moment();
                this.fieldModel.update(this.valueMoment.toISOString());
            }
            this.value = this.valueMoment.toDate();
            this.setTimeFields(this.valueMoment);

            $scope.$watch(() => this.value.valueOf(), newVal => {
                if (newVal) {
                    if (initialDateConversionDone){
                        this.valueMoment = moment(newVal);
                        this.fieldModel.update(this.valueMoment.toISOString());
                        this.setTimeFields(this.valueMoment);
                    } else {
                        initialDateConversionDone = true;
                    }
                }
            });
        }

        private setTimeFields(currentMoment: moment.Moment) {
            this.time = {
                h: currentMoment.format('HH'),
                m: currentMoment.format('mm'),
                s: currentMoment.format('ss')
            };
        }

        public keydown(event: any) {
            // Number pad keyCodes do not work with String.fromCharCode(). See http://stackoverflow.com/a/4793913/772859
            const isNumPadNumber = (keyCode: number): boolean => (96 <= event.which && event.which <= 105);
            let input = <HTMLInputElement>event.target;
            let key = {
                leftArrow: 37,
                rightArrow: 39,
                upArrow: 38,
                downArrow: 40
            };
            let char = String.fromCharCode(event.which);
            let isNumeric = /[0-9]/.test(char) || isNumPadNumber(event.which);
            let isAlpha = /[a-zA-Z]/.test(char) && !isNumPadNumber(event.which);

            if (isAlpha && !isNumeric) {
                event.preventDefault();
                return;
            }

            if (event.which === key.upArrow) {
                this.increment(input);
                event.preventDefault();
            } else if (event.which === key.downArrow) {
                this.decrement(input);
                event.preventDefault();
            }

            if (input.selectionStart === input.value.length && event.which === key.rightArrow) {
                this.focusNext(input);
            }

            if (input.selectionEnd === 0 && event.which === key.leftArrow) {
                this.focusPrev(input);
            }

            if (input.selectionStart === 1) {
                if (input.value.length === 1 && isNumeric) {
                    this.focusNext(input);
                }
            }

        }

        private updateValue(input: HTMLInputElement) {
            let method;
            if (input.classList.contains('hour')) {
                method = "hour";
            } else if (input.classList.contains('minute')) {
                method = "minute";
            } else {
                method = "second";
            }
            this.valueMoment[method](input.value);
            this.value = this.valueMoment.toDate();
        }

        private increment(input: HTMLInputElement) {
            this.valueMoment.add(this.getIncrementAmount(input), 's');
            this.value = this.valueMoment.toDate();
        }

        private decrement(input: HTMLInputElement) {
            this.valueMoment.subtract(this.getIncrementAmount(input), 's');
            this.value = this.valueMoment.toDate();
        }

        private getIncrementAmount(input: HTMLInputElement) {
            var factors = {
                hour: 3600,
                minute: 60,
                second: 1
            };
            return factors[input.classList[0]];
        }

        public focusFirst(event) {
            if (event.target.classList.contains('time-picker')) {
                let input = <HTMLInputElement>this.$element[0].querySelectorAll('.time-picker input')[0];
                input.focus();
            }
        }

        public focus(event, focusTarget) {
            this.$element[0].querySelector('.time-picker').classList.add('focus');
            this.focussed = focusTarget;
            event.preventDefault();
        }

        public blur(event) {
            this.$element[0].querySelector('.time-picker').classList.remove('focus');
            this.updateValue(event.target);
        }

        private focusNext(input) {
            let nextElement = <HTMLInputElement>angular.element(input).next()[0];
            if (nextElement && nextElement.tagName === 'INPUT') {
                setTimeout(() => {
                    nextElement.focus();
                    nextElement.select();
                }, 0);
            }
        }

        private focusPrev(input) {
            function prev(element): HTMLInputElement {
                var elm = element.previousSibling;
                while (elm != null && elm.nodeType !== 1) {
                    elm = elm.previousSibling;
                }
                return elm && elm.tagName === 'INPUT' ? elm : undefined;
            }

            let previousElement = prev(input);
            if (previousElement) {
                setTimeout(() => {
                    previousElement.focus()
                    previousElement.select();
                }, 0);
            }
        }
    }

    /**
     * Input for number field types
     */
    function dateDirective() {
        return makeStandardDDO('date', 'DateController');
    }

    /**
     * Input for boolean field types
     */
    function booleanDirective() {
        return makeStandardDDO('boolean');
    }

    /**
     * Input for select field types
     */
    function selectDirective() {
        return makeStandardDDO('select');
    }

    class NodeController  {

        public fieldModel: INodeFieldModel;
        public value: any;

        constructor(private nodeSelector: NodeSelector,
                    private i18nService: I18nService,
                    private i18n: I18nFilter,
                    private mu: MeshUtils) {
        }

        public showDialog(event: ng.IAngularEvent) {
            let displayMode = 'list';
            var options = {
                displayMode: displayMode,
                allow: this.fieldModel.allow || []
            };
            event.preventDefault();
            this.nodeSelector.open(options)
                .then(nodes => {
                    let newVal = nodes[0];
                    this.fieldModel.value = newVal;
                    this.fieldModel.update(newVal);
                });
        }

        /**
         * Remove a node by setting it to null.
         * TODO: currently not working in Mesh, see https://jira.gentics.com/browse/CL-434 (comments)
         */
        public removeNode() {
            this.fieldModel.value = null;
            this.fieldModel.update(null);
        }

        /**
         * Returns a string representation of the selected node.
         */
        public getNodeName(): string {
            let node = this.fieldModel.value;
            let displayName = node && node.displayName;
            let uuid = node && node.uuid;
            let noneSelected = this.i18n('NO_NODE_SELECTED');
            return displayName || uuid || noneSelected;
        }

        public getBinaryUrl(): string {
            let linkedNode = this.fieldModel.value;
            let nodeBinaryField = this.mu.getFirstBinaryField(linkedNode);
            return this.mu.getBinaryFileUrl(
                this.fieldModel.projectName,
                linkedNode.uuid,
                this.i18nService.getCurrentLang().code,
                nodeBinaryField.key,
                nodeBinaryField.value.sha512sum);
        }

        public hasBinaryField(): boolean {
            let firstBinaryField = this.mu.getFirstBinaryField(this.fieldModel.value);
            return !!(firstBinaryField && firstBinaryField.value);
        }

        /**
         * Returns true if the value is valid according to the "required" property.
         */
        public valueIsValid(): boolean {
            if (this.fieldModel.required) {
                if (!this.fieldModel.value) {
                    return false;
                }
            }
            return true;
        }
    }

    /**
     * Input for node field types
     */
    function nodeDirective() {
        return makeStandardDDO('node', 'NodeController');
    }


    class ListController extends DefaultControlController {


        private dragStartIndex: number;
        private listFieldModels: INodeFieldModel[] = [];
        private availableMicroschemas: string[] = [];

        constructor(private $scope: ng.IScope,
                    private dataService: DataService,
                    private mu: MeshUtils) {
            super($scope);

            /**
             * This watcher uses the expensive "deep object comparison" mode (third arg "true") in order to
             * ensure it fires the handler whenever a micronode field value changes. If a shallow comparison
             * (or $watchCollection) is used, changes to a micronode field value will not trigger an update
             * of the local fieldModel, leading to data being lost when re-ordering items.
             */
            $scope.$watch(() => {
                return this.mu.getPointerByPath(this.fieldModel.node.fields, this.fieldModel.path)[this.fieldModel.path[this.fieldModel.path.length - 1]];
            }, list => {
                    if (list) {
                        this.updateListFieldModels(list);
                        this.fieldModel.value = list;
                    }
                }, true);

            if (this.fieldModel.listType === 'micronode') {
                this.dataService.getProjectMicroschemas(this.fieldModel.projectName)
                    .then(result => {
                        const projectMicroschemas = result.data.map(microschema => microschema.name);
                        this.availableMicroschemas = this.fieldModel.allow
                            .filter(name => -1 < projectMicroschemas.indexOf(name));
                    });
            }
        }

        private updateListFieldModels(list) {
            if (typeof list !== 'undefined') {
                let type = this.fieldModel.listType;

                this.listFieldModels.length = list.length;

                list.forEach((value: any, i: number) => {
                    let target = this.listFieldModels[i];
                    let exists = !!target;
                    let isPrimitiveValue = angular.isString(value) || angular.isNumber(value);
                    let micronodeIdsMatch = exists && this.idsMatch(target.value, value);
                    if (exists && (micronodeIdsMatch || isPrimitiveValue)) {
                        // if this is the same micronode, then we just update the value. Likewise if it is a
                        // primitive value (number or string). This allows us to maintain the same object
                        // reference which means the ng-repeat can operate more efficiently and also
                        // mitigates issues to do with inputs losing focus.
                        this.listFieldModels[i].value = value;
                    } else {
                        this.listFieldModels[i] = this.createListItemFieldModel(type, value, i);
                    }
                    this.listFieldModels[i].allow = this.listFieldModels[i].allow || this.fieldModel.allow;
                });
            }
        }

        /**
         * Returns true if the uuid or tempId of the two micronodes match.
         */
        private idsMatch(existingNode: IMicroschema, newNode: IMicroschema): boolean {
            if (existingNode && newNode && existingNode.uuid && newNode.uuid && existingNode.uuid === newNode.uuid) {
                return true;
            }
            if (existingNode && newNode && existingNode.tempId && newNode.tempId && existingNode.tempId === newNode.tempId) {
                return true;
            }
            return false;
        }

        /**
         * Each item in the list needs its own NodeFieldModel object which can then be passed into the
         * Proxy and generate the sub-s.
         */
        private createListItemFieldModel(type: string, value: any, index: number): INodeFieldModel {
            let path = angular.copy(this.fieldModel.path);

            path.push(index)
            let schemaDef: any = {
                type: type
            };
            if (value && value.microschema) {
                schemaDef.allow = [value.microschema.name];
            }
            let model = this.fieldModel.createChild(value, schemaDef, path);
            return model;
        }

        /**
         * Tracking function to be used in the ng-repeat of the list items. Primitive types should
         * be tracked by $index, whereas microschemas need to be tracked by reference to the
         * object itself in order for sorting to work correctly.
         */
        public tracker(item: INodeFieldModel, $id: Function, $index: number): any {
            return item && item.id;
        }

        /**
         * Add a new, empty microschema control to the list.
         */
        public addControl(microschemaName: string) {
            this.dataService.getMicroschemaByName(microschemaName)
                .then(microschema => this.createEmptyMicroschemaObject(microschema))
                .then(newMicroschemaObject => {
                    if (!this.fieldModel.value) {
                        this.fieldModel.value = []
                    }
                    this.fieldModel.value.push(newMicroschemaObject);
                    this.fieldModel.update(this.fieldModel.value);
                });
        }

        /**
         * Add a new primitive-type item to the list
         */
        public addItem() {
            var defaultValue = this.getDefaultValue(this.fieldModel.listType, this.fieldModel);
            if (!this.fieldModel.value) {
                this.fieldModel.value = [];
            }
            this.fieldModel.value.push(defaultValue);
            this.fieldModel.update(this.fieldModel.value);
        }

        /**
         * Remove the item at index from the list
         */
        public removeItem(index: number) {
            this.fieldModel.value.splice(index, 1);
            this.fieldModel.update(this.fieldModel.value);
        }

        /**
         * Record the index of the item that is being dragged.
         */
        public startDrag(index: number) {
            this.dragStartIndex = index;
        }

        /**
         * Remove the original dragged item from the list.
         */
        public endDrag(item: INodeFieldModel, dragEndIndex: number, list: any[]) {
            var indexToSplice;

            if (dragEndIndex < this.dragStartIndex) {
                indexToSplice = this.dragStartIndex + 1;
            } else {
                indexToSplice = this.dragStartIndex;
            }

            list.splice(dragEndIndex, 0, item.value); // add the new position
            list.splice(indexToSplice, 1); // remove the old position
            this.fieldModel.update(this.fieldModel.value);
        }

        /**
         * Create an empty microschema instance, populated with default values.
         */
        private createEmptyMicroschemaObject(microschema) {
            var newMicroschemaObject = {
                "microschema": {
                    "name": microschema.name,
                    "uuid": microschema.uuid
                },
                "fields": {},
                "tempId": this.mu.generateGuid()
            };

            microschema.fields.forEach(fieldModel => {
                newMicroschemaObject.fields[fieldModel.name] = this.getDefaultValue(fieldModel.type, fieldModel);
            });

            return newMicroschemaObject;
        }

        /**
         * Returns the correct default value for a field definition object.
         */
        private getDefaultValue(type: string, fieldModel: INodeFieldModel): any {
            let defaultValue = null;

            if (typeof fieldModel.defaultValue !== 'undefined') {
                defaultValue = fieldModel.defaultValue;

            } else if (type === 'number') {

                if (typeof fieldModel.min !== 'undefined') {
                    if (typeof fieldModel.max !== 'undefined') {
                        defaultValue = Math.round((fieldModel.min + fieldModel.max) / 2);
                    } else {
                        defaultValue = fieldModel.min;
                    }
                } else {
                    defaultValue = 0;
                }
            } else if (type === 'string' || type === 'html') {
                defaultValue = '';
            } else if (type === 'boolean') {
                defaultValue = false;
            } else if (type === 'date') {
                defaultValue = new Date().toISOString();
            } else if (type === 'select') {
                defaultValue = fieldModel.options[0] || "";
            } else if (type === 'list') {
                defaultValue = [];
            } else if (type === 'node') {
                defaultValue = null;
            }

            return defaultValue;
        }
    }

    /**
     * Input for list field types
     */
    function listDirective() {
        return makeStandardDDO('list', 'ListController');
    }

    class BinaryController {

        public fieldModel: INodeFieldModel;
        public fileToUpload;
        public value: any;
        private transform: IImageTransformParams = {};

        constructor($scope: ng.IScope,
                    private i18nService: I18nService,
                    private mu: MeshUtils) {
            $scope.$watch(() => this.fieldModel.value, val => {
                this.value = angular.copy(val);
            });
        }

        public getBinaryFileUrl(): string {
            if (this.fileToUpload && this.fileToUpload.hasOwnProperty('$ngfBlobUrl')) {
                return this.fileToUpload.$ngfBlobUrl;
            } else if (this.fieldModel.value && typeof this.fieldModel.value.sha512sum !== 'undefined') {
                return this.mu.getBinaryFileUrl(
                    this.fieldModel.projectName,
                    this.fieldModel.node.uuid,
                    this.i18nService.getCurrentLang().code,
                    this.fieldModel.name,
                    this.fieldModel.value.sha512sum
                );
            } else {
                return '';
            }
        }

        /**
         * Update the transform parameters after the image has been edited in the edit dialog.
         */
        public updateTransform(transform?: IImageTransformParams) {
            this.transform = transform;
            this.updateValue();
        }

        /**
         * A new binary file has been selected, so reset the transform params.
         */
        public updateImageSource() {
            this.transform = {};
            this.updateValue();
        }

        private updateValue() {
            let newValue = this.fileToUpload || this.fieldModel.value || {};
            newValue.transform = angular.copy(this.transform);
            this.fieldModel.update(newValue);
        }

        /**
         * Returns true if the value is valid according to the "required" property.
         */
        public valueIsValid(): boolean {
            if (this.fieldModel.required) {
                return this.getBinaryFileUrl() !== '';
            }
            return true;
        }
    }

    function binaryDirective() {
        return makeStandardDDO('binary', 'BinaryController');
    }

    angular.module('meshAdminUi.projects.formBuilder')

        .controller('DefaultControlController', DefaultControlController)
        .controller('ListController', ListController)
        .controller('DateController', DateController)
        .controller('NodeController', NodeController)
        .controller('BinaryController', BinaryController)

        .directive('mhStringControl', stringDirective)
        .directive('mhNumberControl', numberDirective)
        .directive('mhBooleanControl', booleanDirective)
        .directive('mhDateControl', dateDirective)
        .directive('mhSelectControl', selectDirective)
        .directive('mhNodeControl', nodeDirective)
        .directive('mhListControl', listDirective)
        .directive('mhBinaryControl', binaryDirective);
}