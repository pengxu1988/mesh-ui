angular.module('meshAdminUi.projects.formBuilder')
    .directive('widgetProxy', widgetProxyDirective);

/**
 * using the pattern outlined here http://stackoverflow.com/a/20686132/772859
 * to dynamically include the correct directive for the field type.
 */
function widgetProxyDirective($compile) {

    function widgetProxyLinkFn(scope, element, attrs, formBuilderController) {
        var template;

        scope.formBuilder = formBuilderController;

        if (scope.field.type !== 'microschema') {
            var directiveName = 'mh-' + scope.field.type + '-widget';
            template = '<' + directiveName + '></' + directiveName + '>';

        } else {
            // Pass microschema name through the custom widgets to check for a match.
            template = '<microschema-form-builder></microschema-form-builder>';
        }

        var compiledDom = $compile(template)(scope);
        element.append(compiledDom);
    }


    return {
        restrict: 'EA',
        require: '^formBuilder',
        link: widgetProxyLinkFn,
        scope: {
            model: '=',
            path: '=',
            field: '='
        }
    };
}