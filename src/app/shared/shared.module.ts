import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxPaginationModule, PaginatePipe } from 'ngx-pagination';
import { GenticsUICoreModule } from 'gentics-ui-core';

import { NoContentComponent } from './components/no-content/no-content.component';
import { ThumbnailComponent } from './components/thumbnail/thumbnail.component';
import { DisplayFieldPipe } from './pipes/display-field/display-field.pipe';
import { I18nPipe } from './pipes/i18n/i18n.pipe';
import { ScrollFrameDirective } from './components/scroll-frame/scroll-frame.directive';
import { ScrollFrameHeadingDirective } from './components/scroll-frame/scroll-frame-heading.directive';
import { SchemaLabelComponent } from './components/schema-label/schema-label.component';
import { BackgroundFromDirective } from './directives/background-from.directive';
import { HighlightPipe } from './pipes/highlight/highlight.pipe';
import { FileSizePipe } from './pipes/file-size/file-size.pipe';
import { TagComponent } from './components/tag/tag.component';
import { ChipComponent } from './components/chip/chip.component';
import { TagSelectorComponent } from './components/tag-selector/tag-selector.component';
import { AudioPlayButtonComponent } from './components/audio-play-button/audio-play-button.component';
import { FilePreviewComponent } from './components/file-preview/file-preview.component';
import { PaginationControlsComponent } from './components/pagination-controls/pagination-controls.component';
import { ContentPortalComponent } from './components/content-portal/content-portal.component';
import { ProjectContentDirective } from './directives/project-content.directive';

const SHARED_COMPONENTS = [
    ChipComponent,
    NoContentComponent,
    SchemaLabelComponent,
    TagComponent,
    TagSelectorComponent,
    ThumbnailComponent,
    AudioPlayButtonComponent,
    FilePreviewComponent,
    PaginationControlsComponent,
    ContentPortalComponent
];

const SHARED_DIRECTIVES = [
    ScrollFrameDirective,
    ScrollFrameHeadingDirective,
    BackgroundFromDirective,
    ProjectContentDirective
];

const SHARED_PIPES = [
    DisplayFieldPipe,
    FileSizePipe,
    I18nPipe,
    HighlightPipe
];

/**
 * Exposes shared components, services and modules. To be imported into the other app modules which require any of
 * this common functionality.
 */
@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        GenticsUICoreModule,
        RouterModule.forChild([]),
        NgxPaginationModule
    ],
    declarations: [
        ...SHARED_COMPONENTS,
        ...SHARED_PIPES,
        ...SHARED_DIRECTIVES
    ],
    exports: [
        ...SHARED_COMPONENTS,
        ...SHARED_PIPES,
        ...SHARED_DIRECTIVES,
        PaginatePipe,
        GenticsUICoreModule,
        FormsModule,
        ReactiveFormsModule,
        CommonModule
    ]
})
export class SharedModule {}
