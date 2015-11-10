module meshAdminUi {

    /**
     *
     */
    class ProjectExplorerController {

        private itemsPerPage: number = 10;
        private createPermission: boolean;
        private contents = [];
        private childrenSchemas: ISchema[] = [];
        private projectName: string;
        private searchParams: INodeSearchParams = {};

        constructor(private $scope: ng.IScope,
                    private $q: ng.IQService,
                    private dataService: DataService,
                    private mu: MeshUtils,
                    private contextService: ContextService,
                    private dispatcher: Dispatcher,
                    private currentNode: INode) {

            this.projectName = contextService.getProject().name;
            this.createPermission = -1 < currentNode.permissions.indexOf('create');

            const updateContents = () => {
                dataService.getNode(contextService.getProject().name, currentNode.uuid)
                    .then((node: INode) => {
                        this.currentNode = node;
                        return this.getChildrenSchemas();
                    })
                    .then(() => this.populateChildNodes());
            };

            const searchTermHandler = (event, term: string) => {
                this.searchParams.searchTerm = term;
                mu.debounce(() => this.populateChildNodes(), 250)();
            };

            dispatcher.subscribe(dispatcher.events.explorerSearchTermChanged, searchTermHandler);
            dispatcher.subscribe(dispatcher.events.explorerContentsChanged, updateContents);
            $scope.$on('$destroy', () => dispatcher.unsubscribeAll(updateContents, searchTermHandler));

            this.getChildrenSchemas()
                .then(() => this.populateChildNodes());
        }

        /**
         * The node.childrenInfo property contains the name and uuid of the children's schemas, but we need the
         * full schema object in order to do proper search queries, since we need to know the displayField of
         * each child type.
         */
        private getChildrenSchemas() {
            let promises = Object.keys(this.currentNode.childrenInfo).map((schemaName: string) => {
                return this.dataService.getSchema(this.currentNode.childrenInfo[schemaName].schemaUuid);
            });
            return this.$q.all(promises)
                .then(results => {
                    this.childrenSchemas = results;
                });
        }

        /**
         * Fill the vm with the child children of the current node.
         */
        public populateChildNodes(): ng.IPromise<any> {
            var projectName = this.contextService.getProject().name,
                queryParams: INodeListQueryParams = {
                    perPage: this.itemsPerPage
                };

            let bundleParams: INodeBundleParams[] = this.childrenSchemas.map(schemaRef => {
                return {
                    schema: schemaRef,
                    page: 1
                };
            });
            return this.dataService.getNodeBundles(projectName, this.currentNode, bundleParams, this.searchParams, queryParams)
                .then(response => this.contents = response);
        }

        public pageChanged(newPageNumber: number, schemaUuid: string) {
            let bundleParams: INodeBundleParams[] = [{
                schema: this.childrenSchemas.filter(schema => schema.uuid === schemaUuid)[0],
                page: newPageNumber
            }];

            return this.dataService.getNodeBundles(this.projectName, this.currentNode, bundleParams, this.searchParams, {
                perPage: this.itemsPerPage
            }).then(result => {
                var index = this.contents.map(bundle => bundle.schema.uuid).indexOf(schemaUuid);
                this.contents[index].data = result[0].data;
                this.contents[index]._metainfo = result[0]._metainfo;
            });
        }
    }

    angular.module('meshAdminUi.projects')
        .controller('ProjectExplorerController', ProjectExplorerController);


}