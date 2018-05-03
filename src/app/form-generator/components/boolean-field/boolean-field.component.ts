import { Component } from '@angular/core';
import { MeshFieldControlApi } from '../../common/form-generator-models';
import { BaseFieldComponent } from '../base-field/base-field.component';

@Component({
    selector: 'boolean-field',
    templateUrl: 'boolean-field.component.html',
    styleUrls: ['boolean-field.scss']
})
export class BooleanFieldComponent extends BaseFieldComponent {

    api: MeshFieldControlApi;
    value: boolean;

    init(api: MeshFieldControlApi): void {
        this.api = api;
        this.value = api.getValue();
    }

    valueChange(value: boolean): void {
        this.value = value;
    }

    onChange(value: boolean): void {
        this.api.setValue(value);
    }

}
