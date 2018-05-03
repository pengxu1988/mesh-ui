/**
 * Returns a 'type' part of the mimeType header
 * image/jpeg => image
 * video/ogg => video
 */
export function getFileType(mimeType: string, fileName: string): 'image' | 'video' | 'audio' | string | null {
    if (!mimeType) {
        return getExtension(fileName);
    }

    switch (mimeType.toLocaleLowerCase()) {
        case 'text/plain':
        case 'application/plain':
            return 'text';

        default:
            break;
    }

    const parts = mimeType.split('/');
    const type = parts[0].toLowerCase();
    const description = parts[1].toLowerCase();

    switch (type) {
        case 'image':
        case 'video':
        case 'audio':
            return type;

        default:
            break;
    }
    switch (description) {
        case 'vnd.ms-excel':
            return 'Spreadsheed';

        case 'zip':
        case 'x-compressed-zip':
            return '.zip';

        case 'vnd.ms-powerpoint':
        case 'vnd.openxmlformats-officedocument.presentationml.presentation':
            return 'Powerpoint presentation';

        case 'msword':
            return 'Word document';

        case 'pdf':
            return '.pdf';
    }

    return getExtension(fileName);
}


function getExtension (fileName: string): string {
    const extension = fileName.split('.');
    return '.' + extension.pop();
}
