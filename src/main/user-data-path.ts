import { app } from 'electron';
import path from 'path';

export const LEGACY_USER_DATA_DIRNAME = 'Feishin BasicAuth';

app.setPath('userData', path.join(app.getPath('appData'), LEGACY_USER_DATA_DIRNAME));
