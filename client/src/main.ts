import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
    enableProdMode();
}
// @TODO: these logs should not be there in the real prod env
console.info('Stage:', environment.STAGE);
console.info('ServerBaseUrl:', environment.SERVER_BASE_URL);

platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch(err => console.error(err));
