module meshAdminUi {

    enum NodeType {
        PROJECT,
        SCHEMA,
        MICROSCHEMA,
        GROUP,
        USER,
        ROLE,
        NODE
    }

    class RoleDetailController {
        private roleId: string;
        private isNew: boolean;
        private modified: boolean;
        private queryParams;
        private role: IUserRole;
        private schemas: ISchema[];
        private microschemas: IMicroschema[];
        private projects: IProject[];
        private roles: IUserRole[];
        private groups: IUserGroup[];
        private users: IUser[];
        private rootPermissions: {
            [type: string]: any
        } = {};
        private tagItems: any[];
        private tagItemPermissions = {};
        private tagItemRootPermissions = {};

        constructor(
            private $q: ng.IQService,
            private $state: ng.ui.IStateService,
            private $stateParams: any,
            private mu: MeshUtils,
            private confirmActionDialog: ConfirmActionDialog,
            private notifyService: NotifyService,
            private dataService: DataService) {

            this.roleId = $stateParams.uuid;
            this.isNew = this.roleId === undefined || this.roleId === 'new';
            this.modified = false;
            this.queryParams = {
                "role": $stateParams.uuid
            };

            if (!this.isNew) {
                this.getRoleData();


                $q.all([
                        dataService.getSchemas(this.queryParams),
                        dataService.getMicroschemas(this.queryParams),
                        dataService.getProjects(this.queryParams),
                        dataService.getRoles(this.queryParams),
                        dataService.getGroups(this.queryParams),
                        dataService.getUsers(this.queryParams),
                        this.populateTagItems()
                    ])
                    .then((dataArray:any[]) => {
                        this.schemas = dataArray[0].data;
                        this.microschemas = dataArray[1].data;
                        this.projects = dataArray[2].data;
                        this.roles = dataArray[3].data;
                        this.groups = dataArray[4].data;
                        this.users = dataArray[5].data;
                        this.tagItems = dataArray[6];

                        this.getProjectTagFamilyRootPerms(this.projects);
                    })
                    .then(() => this.setTagItemPermissions());

                let types = ['schemas', 'microschemas', 'projects', 'roles', 'groups', 'users'];
                let rootPermPromises = types.map(type => dataService.getPermissions(this.roleId, type));
                $q.all(rootPermPromises)
                    .then((result: any) => {
                        result.forEach((result, index) => {
                            this.rootPermissions[types[index]] = result.permissions;
                        });
                    });
            }
        }

        private getProjectTagFamilyRootPerms(projects) {
            let promises = projects.map(project => {
                let path =`projects/${project.uuid}/tagFamilies`;
                return this.dataService.getPermissions(this.roleId, path);
            });
            return this.$q.all(promises)
                .then(results => {
                    results.forEach((result: any, index: number) => {
                        this.tagItemRootPermissions[projects[index].uuid] = result;
                    });
                });
        }

        /**
         * Populate the this.items array by recur sing through all projects/tagFamilies/tags and flattening the
         * results into an array.
         *
         */
        private populateTagItems(): ng.IPromise<any[]> {
            return this.dataService.getProjects(this.queryParams)
                .then(response => {
                    var promises = [];
                    response.data.forEach(project => {
                        promises.push(project);
                        promises = promises.concat(this.populateTagFamilies(project));
                    });
                    return this.$q.all(promises);
                })
                .then((result: any[]) => this.mu.flatten(result));
        }

        /**
         * Return an array of tagFamilies for the project with the tags of each tagFamily following the
         * tagFamily in the array.
         */
        private populateTagFamilies(project: any): ng.IPromise<any> {
            return this.dataService.getTagFamilies(project.name, this.queryParams)
                .then(response => {
                    var promises = [];
                    project.tagFamilies = response.data;
                    project.tagFamilies.forEach(tagFamily => {
                        promises.push(this.$q.when(tagFamily));
                        promises = promises.concat([this.dataService.getTagFamilyTags(project.name, tagFamily.uuid, this.queryParams)
                            .then(result => result.data)]);
                    });
                    return this.$q.all(promises);
                });
        }

        private setTagItemPermissions() {
            this.tagItems.forEach(item => {
                this.tagItemPermissions[item.uuid] = item.rolePerms;
            });
        }

        /**
         * Get the project data from the server, or in the case of a new project,
         * create an empty project object.
         */
        public getRoleData() {
            if (this.roleId) {
                return this.dataService.getRole(this.roleId)
                    .then(data =>this.role = data);
            } else {
                this.role = this.createEmptyRole();
                this.isNew = true;
            }
        }

        public persist(role: IUserRole) {
            this.dataService.persistRole(role)
                .then(response => {
                    if (this.isNew) {
                        this.notifyService.toast('NEW_ROLE_CREATED');
                        this.isNew = false;
                        this.$state.go('admin.roles.detail', {uuid: response.uuid});
                    } else {
                        this.notifyService.toast('SAVED_CHANGES');
                        this.modified = false;
                    }
                });
        }

        /**
         * Create an empty project object.
         */
        public createEmptyRole(): IUserRole {
            return {
                name: '',
                groups: []
            };
        }

        public isReadonly() {
            return !this.role || this.role.name === 'admin' || !this.role.permissions.update;
        }

        /**
         * Can the current user delete this role?
         */
        public canDelete(): boolean {
            return !!(this.role && this.role.permissions && this.role.permissions.delete);
        }

        /**
         * Delete the role
         */
        public remove(role: IUserRole) {
            this.showDeleteDialog()
                .then(() => this.dataService.deleteRole(role))
                .then(() => {
                    this.notifyService.toast('DELETED');
                    this.$state.go('admin.roles.list');
                });
        }

        /**
         * Confirm deletion of the role
         */
        private showDeleteDialog(): ng.IPromise<any> {
            return this.confirmActionDialog.show({
                title: 'CONFIRM_DELETE_ROLE_TITLE',
                message: 'CONFIRM_DELETE_ROLE_MESSAGE'
            });
        }

        public setTagPermissions(project: IProject, permissions: IPermissionsRequest, tagOrFamily?: ITag | ITagFamily) {
            if (tagOrFamily && (tagOrFamily as ITag).tagFamily) {
                // it is a tag
                return this.dataService.setTagPermissions(this.role.uuid, project.uuid, permissions, tagOrFamily as ITag);
            } else {
                // it is a tagFamily
                let uuid = tagOrFamily && tagOrFamily.uuid;
                return this.dataService.setTagFamilyPermissions(this.role.uuid, project.uuid, permissions, uuid)
                    .then(() => {
                        if (permissions.recursive) {
                            // we need to update the tags since they have been recursively changed.
                            this.populateTagItems()
                                .then(items => this.tagItems = items)
                                .then(() => this.setTagItemPermissions());
                        }
                    })
            }
        }

        public setNodePermissions(node: INode, project:IProject, permissions: IPermissionsRequest) {
            this.dataService.setNodePermissions(this.role.uuid, project.uuid, node.uuid, permissions)
                .then(() => this.notifyService.toast('PERMISSIONS_SET_ON_NODE', { name: node.displayName }));
        }

        public setProjectPermissions(permissions: IPermissionsRequest, project?: IProject) {
            return this.executeSetPermissions(NodeType.PROJECT, permissions, project);
        }

        public setSchemaPermissions(permissions: IPermissionsRequest, schema: ISchema) {
            return this.executeSetPermissions(NodeType.SCHEMA, permissions, schema);
        }

        public setMicroschemaPermissions(permissions: IPermissionsRequest, microschema: IMicroschema) {
            return this.executeSetPermissions(NodeType.MICROSCHEMA, permissions, microschema);
        }

        public setUserPermissions(permissions: IPermissionsRequest, user: IUser) {
            return this.executeSetPermissions(NodeType.USER, permissions, user);
        }

        public setGroupPermissions(permissions: IPermissionsRequest, group: IUserGroup) {
            return this.executeSetPermissions(NodeType.GROUP, permissions, group);
        }

        public setRolePermissions(permissions: IPermissionsRequest, role: IUserRole) {
            return this.executeSetPermissions(NodeType.ROLE, permissions, role);
        }

        public executeSetPermissions(type: NodeType, permissions: IPermissionsRequest, node?: any) {
            let uuid = (typeof node === 'undefined') ? undefined : node.uuid,
                name = (typeof node === 'undefined') ? undefined : node.name || node.username,
                nodeType,
                promise: ng.IPromise<any>;

            switch (type) {
                case NodeType.PROJECT:
                    promise = this.dataService.setProjectPermissions(this.role.uuid, permissions, uuid);
                    nodeType = 'project';
                    break;
                case NodeType.SCHEMA:
                    promise = this.dataService.setSchemaPermissions(this.role.uuid, permissions, uuid);
                    nodeType = 'schema';
                    break;
                case NodeType.MICROSCHEMA:
                    promise = this.dataService.setMicroschemaPermissions(this.role.uuid, permissions, uuid);
                    nodeType = 'microschema';
                    break;
                case NodeType.USER:
                    promise = this.dataService.setUserPermissions(this.role.uuid, permissions, uuid);
                    nodeType = 'user';
                    break;
                case NodeType.GROUP:
                    promise = this.dataService.setGroupPermissions(this.role.uuid, permissions, uuid);
                    nodeType = 'group';
                    break;
                case NodeType.ROLE:
                    promise = this.dataService.setRolePermissions(this.role.uuid, permissions, uuid);
                    nodeType = 'role';
                    break;
                default:
            }

            return promise.then(() => this.notifyPermissionsSuccess(nodeType, name));
        }

        private notifyPermissionsSuccess(nodeType: string, name?: string) {
            this.notifyService.toast('PERMISSIONS_SET_ON_TYPE', { type: nodeType, name })
        }
    }

    angular.module('meshAdminUi.admin')
        .controller('RoleDetailController', RoleDetailController);

}