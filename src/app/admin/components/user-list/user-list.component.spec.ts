import { Component, EventEmitter, Input, Output } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { GenticsUICoreModule, ModalService } from 'gentics-ui-core';

import { UserListComponent } from './user-list.component';
import { AdminUserEffectsService } from '../../providers/effects/admin-user-effects.service';
import { ChipComponent } from '../../../shared/components/chip/chip.component';
import { TestStateModule } from '../../../state/testing/test-state.module';
import { configureComponentTest } from '../../../../testing/configure-component-test';
import { I18nService } from '../../../core/providers/i18n/i18n.service';
import { MockI18nService } from '../../../core/providers/i18n/i18n.service.mock';
import { TestApplicationState } from '../../../state/testing/test-application-state.mock';
import { ApplicationStateService } from '../../../state/providers/application-state.service';
import { ADMIN_GROUP_NAME, ADMIN_USER_NAME } from '../../../common/constants';
import { User } from '../../../common/models/user.model';
import { Group } from '../../../common/models/group.model';
import { MockModalService } from '../../../../testing/modal.service.mock';

describe('UserListComponent', () => {
    let instance: UserListComponent;
    let fixture: ComponentFixture<UserListComponent>;
    let adminUserEffects: MockAdminUserEffectsService;
    let state: TestApplicationState;
    let mockModalService: MockModalService;

    let mockAdminUser: Partial<User>;
    let mockUser1: Partial<User>;
    let mockUser2: Partial<User>;
    let mockAdminGroup: Partial<Group>;
    let mockGroup1: Partial<Group>;

    beforeEach(async(() => {
        configureComponentTest({
            imports: [
                GenticsUICoreModule.forRoot(),
                RouterTestingModule.withRoutes([]),
                TestStateModule,
                ReactiveFormsModule
            ],
            declarations: [
                UserListComponent,
                ChipComponent,
                MockAdminListComponent,
                MockMeshUserGroupSelectComponent
            ],
            providers: [
                { provide: AdminUserEffectsService, useClass: MockAdminUserEffectsService },
                { provide: I18nService, useClass: MockI18nService },
                { provide: ModalService, useClass: MockModalService }
            ]
        });

        adminUserEffects = TestBed.get(AdminUserEffectsService);
        state = TestBed.get(ApplicationStateService);
        mockModalService = TestBed.get(ModalService);

        state.trackAllActionCalls();

        mockAdminGroup = {
            name: ADMIN_GROUP_NAME,
            uuid: 'admin_group_uuid',
        };
        mockGroup1 = {
            name: 'group1',
            uuid: 'group1_uuid',
        };
        mockAdminUser = {
            username: ADMIN_USER_NAME,
            uuid: 'admin_user_uuid',
            groups: [mockAdminGroup] as any,
            permissions: { delete: true } as any
        };
        mockUser1 = {
            username: 'user1',
            uuid: 'user1_uuid',
            groups: [mockGroup1] as any,
            permissions: { delete: true } as any
        };
        mockUser2 = {
            username: 'user2',
            uuid: 'user2_uuid',
            groups: [],
            permissions: { delete: true } as any
        };

        fixture = TestBed.createComponent(UserListComponent);
        instance = fixture.componentInstance;
    }));

    it('should create', () => {
        setMockState();
        expect(instance).toBeTruthy();
    });

    describe('deleteUsers() ', () => {

        it('displays a confirmation modal', fakeAsync(() => {
            setMockState();
            fixture.detectChanges();

            instance.deleteUsers([0, 1, 2]);
            tick();

            expect(mockModalService.dialogSpy).toHaveBeenCalled();
        }));

        it('does not display a confirmation modal if no users are deletable', fakeAsync(() => {
            setMockState();
            fixture.detectChanges();

            instance.deleteUsers([0]);
            tick();

            expect(mockModalService.dialogSpy).not.toHaveBeenCalled();
        }));

        it('does not call adminUserEffects.deleteUser() for admin user', fakeAsync(() => {
            setMockState();
            fixture.detectChanges();

            instance.deleteUsers([0, 1, 2]);
            tick();
            mockModalService.confirmLastModal();

            expect(adminUserEffects.deleteUser).toHaveBeenCalledTimes(2);
            expect(adminUserEffects.deleteUser).toHaveBeenCalledWith(mockUser1);
            expect(adminUserEffects.deleteUser).toHaveBeenCalledWith(mockUser2);
        }));

        it('does not call adminUserEffects.deleteUser() for user for which there is no delete permission', fakeAsync(() => {
            (mockUser1 as any).permissions = { delete: false };
            setMockState();
            fixture.detectChanges();

            instance.deleteUsers([1, 2]);
            tick();
            mockModalService.confirmLastModal();

            expect(adminUserEffects.deleteUser).toHaveBeenCalledTimes(1);
            expect(adminUserEffects.deleteUser).toHaveBeenCalledWith(mockUser2);
        }));

    });

    function setMockState(): void {
        state.mockState({
            entities: {
                user: {
                    [mockAdminUser.uuid]: mockAdminUser as any,
                    [mockUser1.uuid]: mockUser1 as any,
                    [mockUser2.uuid]: mockUser2 as any,
                },
                group: {
                    [mockAdminGroup.uuid]: mockAdminGroup as any,
                    [mockGroup1.uuid]: mockGroup1 as any,
                }
            },
            adminUsers: {
                userList: [mockAdminUser.uuid, mockUser1.uuid, mockUser2.uuid],
                filterGroups: [],
                filterTerm: '',
                pagination: {
                    currentPage: 1,
                    itemsPerPage: 25,
                    totalItems: null
                }
            }
        });
    }
});

@Component({
    selector: 'mesh-admin-list',
    template: ``
})
class MockAdminListComponent {
    @Input() items: any;
    @Input() itemsPerPage: any;
    @Input() totalItems: any;
    @Input() currentPage: any;
    @Input() selection: any;
    @Output() pageChange = new EventEmitter<any>();
}

@Component({
    selector: 'mesh-user-group-select',
    template: ``
})
class MockMeshUserGroupSelectComponent {
    @Input() groups: any[];
    @Input() omit: Array<any> = [];
    @Input() title: any;
    @Input() icon: any;
    @Output() select = new EventEmitter<any>();
}

class MockAdminUserEffectsService {
    loadUsers = jasmine.createSpy('loadUsers');
    loadAllUsers = jasmine.createSpy('loadAllUsers');
    loadAllGroups = jasmine.createSpy('loadAllGroups');
    setListPagination = jasmine.createSpy('setListPagination');
    setFilterTerm = jasmine.createSpy('setFilterTerm');
    setFilterGroups = jasmine.createSpy('setFilterGroups');
    deleteUser = jasmine.createSpy('deleteUser');
}
