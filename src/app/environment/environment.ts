const baseUrl = 'https://localhost:7179/api';

export const environment = {
    production: false,
    baseUrl: baseUrl,
    clientUrl: `${baseUrl}/Client`,
    stateUrl: `${baseUrl}/State`,
    clientDetailsUrl: `${baseUrl}/ClientDetails`,
    filesUploadUrl: `${baseUrl}/File/upload`,
    filesGetUrl: `${baseUrl}/File/clientDetails`,
    filesDeleteUrl: `${baseUrl}/File`
}