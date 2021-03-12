import { DefaultHttpClient, HttpRequest, HttpResponse, NullLogger } from '@aspnet/signalr';

import { IDurableEntitySetConfig } from './IDurableEntitySetConfig';
import { ClientPrincipalHeaderName } from '../shared/common/Constants';

// Custom HttpClient implementation for the purposes of DurableEntitySet
export class DurableHttpClient extends DefaultHttpClient {

    constructor(private _configFabric: () => IDurableEntitySetConfig) {
        super(NullLogger.instance);
    }

    send(request: HttpRequest): Promise<HttpResponse> {

        // Applying custom config settings, but only when calling our backend

        var path = request.url!;
        if (path.startsWith('http')) {
            path = '/' + path.split('/').slice(3).join('/');
        }

        if (path.includes(process.env.REACT_APP_BACKEND_BASE_URI!)) {

            const config = this._configFabric();

            if (!!config.accessTokenFabric) {
                return config.accessTokenFabric().then(accessToken => {

                    request.headers = {}
                    request.headers['Authorization'] = 'Bearer ' + accessToken;

                    return super.send(request);
                });
            }

            if (!!config.fakeUserNameFabric) {
                return config.fakeUserNameFabric().then(fakeUserName => {

                    if (!!fakeUserName) {
                        request.headers = {}
                        request.headers[ClientPrincipalHeaderName] = fakeUserName;
                    }

                    return super.send(request);
                });
            }
        }

        return super.send(request);
    }
}
